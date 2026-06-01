package software.magizhchi.crm.lead;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import software.magizhchi.crm.lead.domain.Lead;
import software.magizhchi.crm.lead.domain.LeadStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeadRepository extends JpaRepository<Lead, UUID> {

    Optional<Lead> findByIdAndCompanyId(UUID id, UUID companyId);

    @Query("select l from Lead l where l.companyId = :companyId "
            + "and (:status is null or l.status = :status) "
            + "and (:assignedMemberId is null or l.assignedMemberId = :assignedMemberId) "
            + "and (:q is null or :q = '' "
            + "     or lower(coalesce(l.name, '')) like lower(concat('%', :q, '%')) "
            + "     or lower(coalesce(l.email, '')) like lower(concat('%', :q, '%')) "
            + "     or coalesce(l.phone, '') like concat('%', :q, '%')) "
            + "order by l.createdAt desc")
    List<Lead> search(@Param("companyId") UUID companyId,
                      @Param("status") LeadStatus status,
                      @Param("assignedMemberId") UUID assignedMemberId,
                      @Param("q") String q);

    @Query("select l.status, count(l) from Lead l where l.companyId = :companyId group by l.status")
    List<Object[]> countByStatus(@Param("companyId") UUID companyId);

    @Query("select l.assignedMemberId, count(l) from Lead l "
            + "where l.companyId = :companyId and l.assignedMemberId is not null "
            + "group by l.assignedMemberId")
    List<Object[]> countByAssignee(@Param("companyId") UUID companyId);

    /** Per-member, per-status counts: rows of [assignedMemberId, status, count]. */
    @Query("select l.assignedMemberId, l.status, count(l) from Lead l "
            + "where l.companyId = :companyId and l.assignedMemberId is not null "
            + "group by l.assignedMemberId, l.status")
    List<Object[]> countByAssigneeAndStatus(@Param("companyId") UUID companyId);

    /** Member-side: leads assigned to me, only within companies I'm still active in. */
    @Query("select l from Lead l where l.assignedMemberId = :memberId "
            + "and l.companyId in :companyIds "
            + "and (:status is null or l.status = :status) "
            + "and (:q is null or :q = '' "
            + "     or lower(coalesce(l.name, '')) like lower(concat('%', :q, '%')) "
            + "     or lower(coalesce(l.email, '')) like lower(concat('%', :q, '%')) "
            + "     or coalesce(l.phone, '') like concat('%', :q, '%')) "
            + "order by l.createdAt desc")
    List<Lead> searchForMember(@Param("memberId") UUID memberId,
                               @Param("companyIds") java.util.Collection<UUID> companyIds,
                               @Param("status") LeadStatus status,
                               @Param("q") String q);

    /** Leads across a set of companies (manager/member view), filtered/searched. */
    @Query("select l from Lead l where l.companyId in :companyIds "
            + "and (:status is null or l.status = :status) "
            + "and (:q is null or :q = '' "
            + "     or lower(coalesce(l.name, '')) like lower(concat('%', :q, '%')) "
            + "     or lower(coalesce(l.email, '')) like lower(concat('%', :q, '%')) "
            + "     or coalesce(l.phone, '') like concat('%', :q, '%')) "
            + "order by l.createdAt desc")
    List<Lead> searchInCompanies(@Param("companyIds") java.util.Collection<UUID> companyIds,
                                 @Param("status") LeadStatus status,
                                 @Param("q") String q);

    /** Member-side per-status counts (across active companies). */
    @Query("select l.status, count(l) from Lead l "
            + "where l.assignedMemberId = :memberId and l.companyId in :companyIds "
            + "group by l.status")
    List<Object[]> countByMemberAndStatus(@Param("memberId") UUID memberId,
                                          @Param("companyIds") java.util.Collection<UUID> companyIds);

    Optional<Lead> findByIdAndAssignedMemberIdAndCompanyIdIn(
            UUID id, UUID memberId, java.util.Collection<UUID> companyIds);

    /** Duplicate guard: same phone (exact) in this company. */
    long countByCompanyIdAndPhone(UUID companyId, String phone);

    /** Duplicate guard: same email (case-insensitive) in this company. */
    @Query("select count(l) from Lead l where l.companyId = :companyId "
            + "and lower(l.email) = lower(:email)")
    long countByCompanyIdAndEmailIgnoreCase(@Param("companyId") UUID companyId,
                                            @Param("email") String email);
}
