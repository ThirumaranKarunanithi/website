package software.magizhchi.crm.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import software.magizhchi.crm.auth.domain.Account;
import software.magizhchi.crm.auth.domain.AccountStatus;
import software.magizhchi.crm.auth.domain.AccountType;
import software.magizhchi.crm.auth.jwt.JwtService;
import software.magizhchi.crm.auth.web.dto.AuthResponse;
import software.magizhchi.crm.auth.web.dto.LoginRequest;
import software.magizhchi.crm.auth.web.dto.SignupRequest;
import software.magizhchi.crm.common.ApiException;
import software.magizhchi.crm.company.CompanyRepository;
import software.magizhchi.crm.company.domain.Company;
import software.magizhchi.crm.member.MemberProfileRepository;
import software.magizhchi.crm.member.domain.MemberProfile;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final AccountRepository accounts;
    private final CompanyRepository companies;
    private final MemberProfileRepository members;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AccountRepository accounts,
                       CompanyRepository companies,
                       MemberProfileRepository members,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.accounts = accounts;
        this.companies = companies;
        this.members = members;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        if (accounts.existsByEmailIgnoreCase(req.email())) {
            throw ApiException.conflict("An account with this email already exists.");
        }

        Account account = accounts.save(Account.builder()
                .email(req.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.password()))
                .accountType(req.accountType())
                .status(AccountStatus.ACTIVE)
                .build());

        if (req.accountType() == AccountType.COMPANY) {
            if (!StringUtils.hasText(req.companyName())) {
                throw ApiException.badRequest("companyName is required for a Company account.");
            }
            Company company = companies.save(Company.builder()
                    .accountId(account.getId())
                    .name(req.companyName().trim())
                    .themeAccent("#FF7A00")
                    .build());
            return token(account, company.getId(), company.getName());
        } else {
            if (!StringUtils.hasText(req.displayName())) {
                throw ApiException.badRequest("displayName is required for a Member account.");
            }
            MemberProfile profile = members.save(MemberProfile.builder()
                    .accountId(account.getId())
                    .displayName(req.displayName().trim())
                    .phone(req.phone())
                    .build());
            return token(account, null, profile.getDisplayName());
        }
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        Account account = accounts.findByEmailIgnoreCase(req.email())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password."));

        if (!passwordEncoder.matches(req.password(), account.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password.");
        }
        if (account.getStatus() == AccountStatus.SUSPENDED) {
            throw ApiException.unauthorized("This account is suspended.");
        }

        if (account.getAccountType() == AccountType.COMPANY) {
            Company company = companies.findByAccountId(account.getId())
                    .orElseThrow(() -> ApiException.unauthorized("Company profile missing."));
            return token(account, company.getId(), company.getName());
        } else {
            String name = members.findByAccountId(account.getId())
                    .map(MemberProfile::getDisplayName)
                    .orElse(account.getEmail());
            return token(account, null, name);
        }
    }

    private AuthResponse token(Account account, UUID companyId, String displayName) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", account.getAccountType().name());
        if (companyId != null) {
            claims.put("companyId", companyId.toString());
        }
        String jwt = jwtService.issue(account.getId().toString(), claims);
        return new AuthResponse(
                jwt,
                jwtService.getTtlMinutes(),
                account.getId(),
                account.getAccountType(),
                companyId,
                displayName);
    }
}
