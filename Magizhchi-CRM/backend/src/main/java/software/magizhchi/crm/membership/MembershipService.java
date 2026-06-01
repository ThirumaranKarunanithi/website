package software.magizhchi.crm.membership;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import software.magizhchi.crm.auth.AccountRepository;
import software.magizhchi.crm.auth.domain.Account;
import software.magizhchi.crm.auth.domain.AccountType;
import software.magizhchi.crm.common.ApiException;
import software.magizhchi.crm.company.CompanyRepository;
import software.magizhchi.crm.company.domain.Company;
import software.magizhchi.crm.member.MemberProfileRepository;
import software.magizhchi.crm.member.domain.MemberProfile;
import software.magizhchi.crm.membership.domain.Designation;
import software.magizhchi.crm.membership.domain.Membership;
import software.magizhchi.crm.membership.domain.MembershipStatus;
import software.magizhchi.crm.membership.web.dto.*;
import software.magizhchi.crm.tenancy.TenantContext;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MembershipService {

    private final MembershipRepository memberships;
    private final DesignationRepository designations;
    private final AccountRepository accounts;
    private final MemberProfileRepository profiles;
    private final CompanyRepository companies;

    public MembershipService(MembershipRepository memberships,
                             DesignationRepository designations,
                             AccountRepository accounts,
                             MemberProfileRepository profiles,
                             CompanyRepository companies) {
        this.memberships = memberships;
        this.designations = designations;
        this.accounts = accounts;
        this.profiles = profiles;
        this.companies = companies;
    }

    private UUID companyId() {
        UUID cid = TenantContext.companyId();
        if (cid == null) throw ApiException.forbidden("Only company accounts can manage members.");
        return cid;
    }

    private UUID memberAccountId() {
        var p = TenantContext.get();
        if (p == null || p.accountType() != AccountType.MEMBER) {
            throw ApiException.forbidden("Only member accounts can do this.");
        }
        return p.accountId();
    }

    // ======================= COMPANY SIDE =======================

    @Transactional
    public MemberRow invite(InviteRequest req) {
        UUID cid = companyId();
        Account acct = accounts.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> ApiException.badRequest(
                        "No member account found for " + req.email()
                        + ". Ask them to sign up as a Member first, then invite again."));
        if (acct.getAccountType() != AccountType.MEMBER) {
            throw ApiException.badRequest("That email belongs to a Company account, not a Member.");
        }

        Designation desig = resolveDesignation(cid, req.designationId());

        Membership existing = memberships.findByCompanyIdAndMemberAccountId(cid, acct.getId()).orElse(null);
        if (existing != null) {
            switch (existing.getStatus()) {
                case PENDING -> throw ApiException.conflict("An invite is already pending for this member.");
                case ACCEPTED -> throw ApiException.conflict("This member is already in your company.");
                case DECLINED, REMOVED -> {
                    // re-invite: reset to PENDING
                    existing.setStatus(MembershipStatus.PENDING);
                    existing.setDesignationId(desig == null ? null : desig.getId());
                    existing.setInvitedAt(Instant.now());
                    existing.setAcceptedAt(null);
                    memberships.save(existing);
                    return toRow(existing, acct, profile(acct.getId()), desig);
                }
            }
        }

        Membership m = memberships.save(Membership.builder()
                .companyId(cid)
                .memberAccountId(acct.getId())
                .designationId(desig == null ? null : desig.getId())
                .status(MembershipStatus.PENDING)
                .build());
        return toRow(m, acct, profile(acct.getId()), desig);
    }

    @Transactional(readOnly = true)
    public List<MemberRow> listMembers() {
        UUID cid = companyId();
        List<Membership> rows = memberships.findByCompanyIdAndStatusNotOrderByInvitedAtDesc(cid, MembershipStatus.REMOVED);
        return assemble(rows, cid);
    }

    @Transactional
    public MemberRow setDesignation(UUID membershipId, UUID designationId) {
        UUID cid = companyId();
        Membership m = owned(membershipId, cid);
        Designation desig = resolveDesignation(cid, designationId);
        m.setDesignationId(desig == null ? null : desig.getId());
        memberships.save(m);
        Account acct = accounts.findById(m.getMemberAccountId()).orElse(null);
        return toRow(m, acct, profile(m.getMemberAccountId()), desig);
    }

    /** Remove a member: hard isolation — they immediately lose all access to this company. */
    @Transactional
    public void remove(UUID membershipId) {
        UUID cid = companyId();
        Membership m = owned(membershipId, cid);
        m.setStatus(MembershipStatus.REMOVED);
        memberships.save(m);
    }

    // ---- Designations (company) ----

    @Transactional(readOnly = true)
    public List<DesignationDto> listDesignations() {
        return designations.findByCompanyIdOrderByName(companyId()).stream()
                .map(DesignationDto::from).toList();
    }

    @Transactional
    public DesignationDto addDesignation(String name) {
        UUID cid = companyId();
        if (!StringUtils.hasText(name)) throw ApiException.badRequest("Designation name is required.");
        String trimmed = name.trim();
        if (designations.existsByCompanyIdAndNameIgnoreCase(cid, trimmed)) {
            throw ApiException.conflict("That designation already exists.");
        }
        Designation d = designations.save(Designation.builder().companyId(cid).name(trimmed).build());
        return DesignationDto.from(d);
    }

    @Transactional
    public void deleteDesignation(UUID id) {
        UUID cid = companyId();
        Designation d = designations.findById(id)
                .orElseThrow(() -> ApiException.notFound("Designation not found."));
        if (!d.getCompanyId().equals(cid)) throw ApiException.notFound("Designation not found.");
        designations.delete(d);
    }

    // ======================= MEMBER SIDE =======================

    @Transactional(readOnly = true)
    public List<InviteRow> myInvites() {
        UUID mid = memberAccountId();
        return memberships.findByMemberAccountIdAndStatusOrderByInvitedAtDesc(mid, MembershipStatus.PENDING)
                .stream().map(this::toInviteRow).toList();
    }

    @Transactional(readOnly = true)
    public List<InviteRow> myCompanies() {
        UUID mid = memberAccountId();
        return memberships.findByMemberAccountIdAndStatusOrderByInvitedAtDesc(mid, MembershipStatus.ACCEPTED)
                .stream().map(this::toInviteRow).toList();
    }

    @Transactional
    public InviteRow accept(UUID membershipId) {
        Membership m = memberOwned(membershipId);
        if (m.getStatus() != MembershipStatus.PENDING) {
            throw ApiException.badRequest("This invite is no longer pending.");
        }
        m.setStatus(MembershipStatus.ACCEPTED);
        m.setAcceptedAt(Instant.now());
        memberships.save(m);
        return toInviteRow(m);
    }

    @Transactional
    public void decline(UUID membershipId) {
        Membership m = memberOwned(membershipId);
        if (m.getStatus() != MembershipStatus.PENDING) {
            throw ApiException.badRequest("This invite is no longer pending.");
        }
        m.setStatus(MembershipStatus.DECLINED);
        memberships.save(m);
    }

    // ======================= helpers =======================

    private Membership owned(UUID membershipId, UUID cid) {
        Membership m = memberships.findById(membershipId)
                .orElseThrow(() -> ApiException.notFound("Member not found."));
        if (!m.getCompanyId().equals(cid)) throw ApiException.notFound("Member not found.");
        return m;
    }

    private Membership memberOwned(UUID membershipId) {
        UUID mid = memberAccountId();
        Membership m = memberships.findById(membershipId)
                .orElseThrow(() -> ApiException.notFound("Invite not found."));
        if (!m.getMemberAccountId().equals(mid)) throw ApiException.notFound("Invite not found.");
        return m;
    }

    private Designation resolveDesignation(UUID cid, UUID designationId) {
        if (designationId == null) return null;
        Designation d = designations.findById(designationId)
                .orElseThrow(() -> ApiException.badRequest("Designation not found."));
        if (!d.getCompanyId().equals(cid)) throw ApiException.badRequest("Designation not found.");
        return d;
    }

    private MemberProfile profile(UUID accountId) {
        return profiles.findByAccountId(accountId).orElse(null);
    }

    private List<MemberRow> assemble(List<Membership> rows, UUID cid) {
        if (rows.isEmpty()) return List.of();
        Set<UUID> accountIds = rows.stream().map(Membership::getMemberAccountId).collect(Collectors.toSet());
        Set<UUID> desigIds = rows.stream().map(Membership::getDesignationId)
                .filter(Objects::nonNull).collect(Collectors.toSet());

        Map<UUID, Account> accById = accounts.findByIdIn(accountIds).stream()
                .collect(Collectors.toMap(Account::getId, a -> a));
        Map<UUID, MemberProfile> profById = profiles.findByAccountIdIn(accountIds).stream()
                .collect(Collectors.toMap(MemberProfile::getAccountId, p -> p));
        Map<UUID, Designation> desById = desigIds.isEmpty() ? Map.of()
                : designations.findByIdIn(desigIds).stream()
                    .collect(Collectors.toMap(Designation::getId, d -> d));

        // Cross-company: for each member, the list of companies they're ACCEPTED in.
        Map<UUID, List<String>> companiesByMember = new HashMap<>();
        List<Membership> active = memberships.findByMemberAccountIdInAndStatus(accountIds, MembershipStatus.ACCEPTED);
        Set<UUID> companyIds = active.stream().map(Membership::getCompanyId).collect(Collectors.toSet());
        Map<UUID, String> companyNames = new HashMap<>();
        for (Company c : companies.findAllById(companyIds)) companyNames.put(c.getId(), c.getName());
        for (Membership a : active) {
            companiesByMember.computeIfAbsent(a.getMemberAccountId(), k -> new ArrayList<>())
                    .add(companyNames.getOrDefault(a.getCompanyId(), "Company"));
        }

        List<MemberRow> out = new ArrayList<>(rows.size());
        for (Membership m : rows) {
            out.add(toRow(m, accById.get(m.getMemberAccountId()),
                    profById.get(m.getMemberAccountId()),
                    m.getDesignationId() == null ? null : desById.get(m.getDesignationId()),
                    companiesByMember.getOrDefault(m.getMemberAccountId(), List.of())));
        }
        return out;
    }

    private MemberRow toRow(Membership m, Account acct, MemberProfile prof, Designation desig) {
        return toRow(m, acct, prof, desig, List.of());
    }

    private MemberRow toRow(Membership m, Account acct, MemberProfile prof, Designation desig,
                            List<String> companies) {
        return new MemberRow(
                m.getId(),
                m.getMemberAccountId(),
                prof != null ? prof.getDisplayName() : (acct != null ? acct.getEmail() : "Member"),
                acct != null ? acct.getEmail() : null,
                prof != null ? prof.getPhone() : null,
                desig != null ? desig.getId() : null,
                desig != null ? desig.getName() : null,
                m.getStatus().name(),
                m.getInvitedAt(),
                m.getAcceptedAt(),
                m.isCanAssign(),
                companies.size(),
                companies);
    }

    /** Grant/revoke the manager "can assign leads" permission. */
    @Transactional
    public MemberRow setCanAssign(UUID membershipId, boolean canAssign) {
        UUID cid = companyId();
        Membership m = owned(membershipId, cid);
        m.setCanAssign(canAssign);
        memberships.save(m);
        Account acct = accounts.findById(m.getMemberAccountId()).orElse(null);
        Designation desig = m.getDesignationId() == null ? null
                : designations.findById(m.getDesignationId()).orElse(null);
        return toRow(m, acct, profile(m.getMemberAccountId()), desig);
    }

    private InviteRow toInviteRow(Membership m) {
        Company c = companies.findById(m.getCompanyId()).orElse(null);
        String desigName = null;
        if (m.getDesignationId() != null) {
            desigName = designations.findById(m.getDesignationId()).map(Designation::getName).orElse(null);
        }
        return new InviteRow(
                m.getId(),
                m.getCompanyId(),
                c != null ? c.getName() : "Company",
                desigName,
                m.getStatus().name(),
                m.getInvitedAt(),
                m.getAcceptedAt());
    }
}
