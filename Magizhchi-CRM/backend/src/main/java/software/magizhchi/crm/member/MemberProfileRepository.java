package software.magizhchi.crm.member;

import org.springframework.data.jpa.repository.JpaRepository;
import software.magizhchi.crm.member.domain.MemberProfile;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MemberProfileRepository extends JpaRepository<MemberProfile, UUID> {
    Optional<MemberProfile> findByAccountId(UUID accountId);

    List<MemberProfile> findByAccountIdIn(Collection<UUID> accountIds);
}
