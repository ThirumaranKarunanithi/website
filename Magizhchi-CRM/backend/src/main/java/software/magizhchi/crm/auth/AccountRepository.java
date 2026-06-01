package software.magizhchi.crm.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import software.magizhchi.crm.auth.domain.Account;

import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    Optional<Account> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    java.util.List<Account> findByIdIn(java.util.Collection<UUID> ids);
}
