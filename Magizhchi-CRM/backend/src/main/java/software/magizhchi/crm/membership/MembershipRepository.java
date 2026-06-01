package software.magizhchi.crm.membership;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import software.magizhchi.crm.lead.web.dto.AssignableMember;
import software.magizhchi.crm.membership.domain.Membership;

import software.magizhchi.crm.membership.domain.MembershipStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembershipRepository extends JpaRepository<Membership, UUID> {

    @Query("select new software.magizhchi.crm.lead.web.dto.AssignableMember("
            + "m.memberAccountId, p.displayName, a.email) "
            + "from Membership m "
            + "join MemberProfile p on p.accountId = m.memberAccountId "
            + "join Account a on a.id = m.memberAccountId "
            + "where m.companyId = :companyId "
            + "and m.status = software.magizhchi.crm.membership.domain.MembershipStatus.ACCEPTED "
            + "order by p.displayName")
    List<AssignableMember> findAssignable(@Param("companyId") UUID companyId);

    @Query("select m.memberAccountId from Membership m "
            + "where m.companyId = :companyId "
            + "and m.status = software.magizhchi.crm.membership.domain.MembershipStatus.ACCEPTED")
    List<UUID> findAcceptedMemberIds(@Param("companyId") UUID companyId);

    boolean existsByCompanyIdAndMemberAccountIdAndStatus(
            UUID companyId, UUID memberAccountId,
            software.magizhchi.crm.membership.domain.MembershipStatus status);

    // Company-side: all memberships for a company except a given status, newest first.
    List<Membership> findByCompanyIdAndStatusNotOrderByInvitedAtDesc(UUID companyId, MembershipStatus status);

    // Member-side: memberships for this member in a given status, newest first.
    List<Membership> findByMemberAccountIdAndStatusOrderByInvitedAtDesc(UUID memberAccountId, MembershipStatus status);

    // Cross-company: all active memberships for a set of members (for the per-member company list).
    List<Membership> findByMemberAccountIdInAndStatus(java.util.Collection<UUID> memberAccountIds, MembershipStatus status);

    // Member-side isolation: company ids where this member is currently ACCEPTED.
    @Query("select m.companyId from Membership m "
            + "where m.memberAccountId = :memberAccountId "
            + "and m.status = software.magizhchi.crm.membership.domain.MembershipStatus.ACCEPTED")
    List<UUID> findActiveCompanyIds(@Param("memberAccountId") UUID memberAccountId);

    // Companies where this member is ACCEPTED *and* can assign (manager view).
    @Query("select m.companyId from Membership m "
            + "where m.memberAccountId = :memberAccountId and m.canAssign = true "
            + "and m.status = software.magizhchi.crm.membership.domain.MembershipStatus.ACCEPTED")
    List<UUID> findManagerCompanyIds(@Param("memberAccountId") UUID memberAccountId);

    Optional<Membership> findByCompanyIdAndMemberAccountId(UUID companyId, UUID memberAccountId);
}
