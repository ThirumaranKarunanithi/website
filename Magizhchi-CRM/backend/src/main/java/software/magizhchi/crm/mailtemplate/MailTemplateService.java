package software.magizhchi.crm.mailtemplate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.magizhchi.crm.auth.AccountRepository;
import software.magizhchi.crm.auth.domain.Account;
import software.magizhchi.crm.common.ApiException;
import software.magizhchi.crm.company.CompanyRepository;
import software.magizhchi.crm.company.domain.Company;
import software.magizhchi.crm.lead.LeadEventRepository;
import software.magizhchi.crm.lead.LeadRepository;
import software.magizhchi.crm.lead.domain.Lead;
import software.magizhchi.crm.lead.domain.LeadEvent;
import software.magizhchi.crm.lead.domain.LeadEventType;
import software.magizhchi.crm.member.MemberProfileRepository;
import software.magizhchi.crm.member.domain.MemberProfile;
import software.magizhchi.crm.mailtemplate.domain.MailTemplate;
import software.magizhchi.crm.mailtemplate.web.dto.TemplateRequest;
import software.magizhchi.crm.mailtemplate.web.dto.TemplateResponse;
import software.magizhchi.crm.membership.MembershipRepository;
import software.magizhchi.crm.tenancy.TenantContext;

import java.util.*;

@Service
public class MailTemplateService {

    private static final Logger log = LoggerFactory.getLogger(MailTemplateService.class);

    private final MailTemplateRepository templates;
    private final LeadRepository leads;
    private final LeadEventRepository events;
    private final CompanyRepository companies;
    private final MemberProfileRepository profiles;
    private final AccountRepository accounts;
    private final MembershipRepository memberships;

    public MailTemplateService(MailTemplateRepository templates, LeadRepository leads,
                               LeadEventRepository events, CompanyRepository companies,
                               MemberProfileRepository profiles, AccountRepository accounts,
                               MembershipRepository memberships) {
        this.templates = templates;
        this.leads = leads;
        this.events = events;
        this.companies = companies;
        this.profiles = profiles;
        this.accounts = accounts;
        this.memberships = memberships;
    }

    private UUID companyId() {
        UUID cid = TenantContext.companyId();
        if (cid == null) throw ApiException.forbidden("Only company accounts can manage mail templates.");
        return cid;
    }

    // ---- Company CRUD ----

    @Transactional(readOnly = true)
    public List<TemplateResponse> list() {
        return templates.findByCompanyIdOrderByCodeAsc(companyId()).stream()
                .map(TemplateResponse::from).toList();
    }

    @Transactional
    public TemplateResponse create(TemplateRequest req) {
        UUID cid = companyId();
        String code = req.code().trim().toUpperCase().replaceAll("\\s+", "_");
        if (templates.existsByCompanyIdAndCodeIgnoreCase(cid, code)) {
            throw ApiException.conflict("A template with code " + code + " already exists.");
        }
        MailTemplate t = templates.save(MailTemplate.builder()
                .companyId(cid).code(code).subject(req.subject().trim()).body(req.body()).build());
        return TemplateResponse.from(t);
    }

    @Transactional
    public TemplateResponse update(UUID id, TemplateRequest req) {
        UUID cid = companyId();
        MailTemplate t = templates.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> ApiException.notFound("Template not found."));
        String code = req.code().trim().toUpperCase().replaceAll("\\s+", "_");
        if (!t.getCode().equalsIgnoreCase(code) && templates.existsByCompanyIdAndCodeIgnoreCase(cid, code)) {
            throw ApiException.conflict("A template with code " + code + " already exists.");
        }
        t.setCode(code);
        t.setSubject(req.subject().trim());
        t.setBody(req.body());
        return TemplateResponse.from(templates.save(t));
    }

    @Transactional
    public void delete(UUID id) {
        UUID cid = companyId();
        MailTemplate t = templates.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> ApiException.notFound("Template not found."));
        templates.delete(t);
    }

    // ---- Member: list templates for a lead's company + send by code ----

    public record RenderedMail(String code, String subject, String body, String to) {}

    /** Templates available to a member for a given company (they're an active member of). */
    @Transactional(readOnly = true)
    public List<TemplateResponse> listForCompany(UUID companyId) {
        return templates.findByCompanyIdOrderByCodeAsc(companyId).stream()
                .map(TemplateResponse::from).toList();
    }

    /**
     * Member sends a templated mail to a lead, chosen by code. Renders merge vars,
     * logs a MAIL event, and (dev-mode) logs the rendered email. Returns the
     * rendered content so the UI can preview/confirm.
     */
    @Transactional
    public RenderedMail sendToLead(UUID leadId, String code) {
        UUID actor = TenantContext.accountId();
        Lead lead = leads.findById(leadId)
                .orElseThrow(() -> ApiException.notFound("Lead not found."));

        // Authorize: company owner of the lead's company, OR an active member of it.
        UUID cid = TenantContext.companyId();
        boolean isOwner = cid != null && cid.equals(lead.getCompanyId());
        boolean isMember = cid == null && memberships
                .findActiveCompanyIds(actor).contains(lead.getCompanyId());
        if (!isOwner && !isMember) throw ApiException.notFound("Lead not found.");

        if (lead.getEmail() == null || lead.getEmail().isBlank()) {
            throw ApiException.badRequest("This lead has no email address.");
        }

        MailTemplate t = templates.findByCompanyIdAndCodeIgnoreCase(lead.getCompanyId(), code)
                .orElseThrow(() -> ApiException.badRequest("No template with code " + code + "."));

        Map<String, String> vars = buildVars(lead, actor);
        String subject = MailMerge.render(t.getSubject(), vars);
        String body = MailMerge.render(t.getBody(), vars);

        // Dev-mode "delivery": log it. Swap for Amazon SES later behind this call.
        log.info("[MAIL DEV] to={} subject={} body={}", lead.getEmail(), subject, body);

        Map<String, Object> payload = new HashMap<>();
        payload.put("code", t.getCode());
        payload.put("subject", subject);
        payload.put("to", lead.getEmail());
        events.save(LeadEvent.builder()
                .companyId(lead.getCompanyId()).leadId(lead.getId())
                .type(LeadEventType.MAIL).payload(payload).actorAccountId(actor).build());

        return new RenderedMail(t.getCode(), subject, body, lead.getEmail());
    }

    private Map<String, String> buildVars(Lead lead, UUID actorAccountId) {
        Map<String, String> v = new HashMap<>();
        v.put("lead.name", n(lead.getName()));
        v.put("lead.phone", n(lead.getPhone()));
        v.put("lead.email", n(lead.getEmail()));
        Company c = companies.findById(lead.getCompanyId()).orElse(null);
        v.put("company.name", c == null ? "" : c.getName());
        // actor: member profile name, else account email
        String actorName = profiles.findByAccountId(actorAccountId).map(MemberProfile::getDisplayName)
                .orElseGet(() -> accounts.findById(actorAccountId).map(Account::getEmail).orElse(""));
        v.put("member.name", actorName);
        return v;
    }

    private static String n(String s) { return s == null ? "" : s; }
}
