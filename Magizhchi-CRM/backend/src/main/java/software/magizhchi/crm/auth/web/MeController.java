package software.magizhchi.crm.auth.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import software.magizhchi.crm.auth.AccountRepository;
import software.magizhchi.crm.auth.domain.Account;
import software.magizhchi.crm.common.ApiException;
import software.magizhchi.crm.company.CompanyRepository;
import software.magizhchi.crm.member.MemberProfileRepository;
import software.magizhchi.crm.member.domain.MemberProfile;
import software.magizhchi.crm.tenancy.TenantContext;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    private final AccountRepository accounts;
    private final CompanyRepository companies;
    private final MemberProfileRepository members;

    public MeController(AccountRepository accounts,
                        CompanyRepository companies,
                        MemberProfileRepository members) {
        this.accounts = accounts;
        this.companies = companies;
        this.members = members;
    }

    public record MeResponse(UUID accountId, String email, String accountType,
                             UUID companyId, String displayName) {}

    @GetMapping
    public MeResponse me() {
        UUID accountId = TenantContext.accountId();
        if (accountId == null) {
            throw ApiException.unauthorized("Not authenticated.");
        }
        Account account = accounts.findById(accountId)
                .orElseThrow(() -> ApiException.unauthorized("Account not found."));

        String displayName;
        UUID companyId = TenantContext.companyId();
        if (companyId != null) {
            displayName = companies.findById(companyId).map(c -> c.getName()).orElse(account.getEmail());
        } else {
            displayName = members.findByAccountId(accountId)
                    .map(MemberProfile::getDisplayName)
                    .orElse(account.getEmail());
        }

        return new MeResponse(
                account.getId(),
                account.getEmail(),
                account.getAccountType().name(),
                companyId,
                displayName);
    }
}
