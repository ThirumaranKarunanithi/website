package software.magizhchi.crm.auth.web;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import software.magizhchi.crm.auth.AuthService;
import software.magizhchi.crm.auth.web.dto.AuthResponse;
import software.magizhchi.crm.auth.web.dto.LoginRequest;
import software.magizhchi.crm.auth.web.dto.SignupRequest;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
