package com.magizhchi.dbcommunicator.ui;

import com.magizhchi.dbcommunicator.auth.AuthClient;
import com.magizhchi.dbcommunicator.auth.AuthSession;
import com.magizhchi.dbcommunicator.auth.AuthStore;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.CheckBox;
import javafx.scene.control.Hyperlink;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.VBox;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

/**
 * Passwordless sign-in: user enters email → server emails a 6-digit code →
 * user enters the code → server returns a session token (creating the account
 * on first verify if the email is new).
 */
@Component
public class AuthScreenController {

    private static final Logger log = LoggerFactory.getLogger(AuthScreenController.class);

    private enum Step { ENTER_EMAIL, ENTER_OTP }

    private final AuthClient authClient;
    private final AuthStore authStore;

    @FXML private ImageView logoImage;
    @FXML private Label screenSubtitle;
    @FXML private TextField nameInput;
    @FXML private TextField emailInput;
    @FXML private VBox otpField;
    @FXML private TextField otpInput;
    @FXML private Hyperlink resendLink;
    @FXML private Hyperlink changeEmailLink;
    @FXML private CheckBox rememberMe;
    @FXML private Label errorLabel;
    @FXML private Button primaryButton;

    private Step step = Step.ENTER_EMAIL;
    /** True once requestOtp determined this is a brand-new account (uses the register/verify endpoint). */
    private boolean isNewUserFlow;
    private Consumer<AuthSession> onAuthSuccess;

    private final ExecutorService bg = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "auth-bg");
        t.setDaemon(true);
        return t;
    });

    public AuthScreenController(AuthClient authClient, AuthStore authStore) {
        this.authClient = authClient;
        this.authStore = authStore;
    }

    @FXML
    public void initialize() {
        loadLogo();
        applyStep();
        clearError();

        // OTP field accepts only digits, max 6 chars.
        otpInput.textProperty().addListener((obs, was, now) -> {
            if (now == null) return;
            String cleaned = now.replaceAll("\\D", "");
            if (cleaned.length() > 6) cleaned = cleaned.substring(0, 6);
            if (!cleaned.equals(now)) otpInput.setText(cleaned);
        });
    }

    private void loadLogo() {
        var stream = getClass().getResourceAsStream("/images/logo.png");
        if (stream == null) { logoImage.setVisible(false); logoImage.setManaged(false); return; }
        try {
            logoImage.setImage(new Image(stream, 0, 168, true, true));
            logoImage.setSmooth(true);
            logoImage.setCache(true);
        } catch (Exception e) {
            logoImage.setVisible(false);
            logoImage.setManaged(false);
        }
    }

    public void setOnAuthSuccess(Consumer<AuthSession> handler) { this.onAuthSuccess = handler; }

    // ---------- Step transitions ----------

    private void applyStep() {
        boolean isOtp = step == Step.ENTER_OTP;
        otpField.setVisible(isOtp);
        otpField.setManaged(isOtp);
        emailInput.setDisable(isOtp);
        nameInput.setDisable(isOtp);
        primaryButton.setText(isOtp ? "Verify & continue" : "Send code");
        screenSubtitle.setText(isOtp
                ? "We sent a 6-digit code to " + safe(emailInput.getText())
                : "Sign in with a one-time email code");
        if (isOtp) Platform.runLater(() -> otpInput.requestFocus());
    }

    @FXML
    public void onChangeEmail() {
        step = Step.ENTER_EMAIL;
        otpInput.clear();
        clearError();
        applyStep();
    }

    @FXML
    public void onResend() {
        sendOtp();
    }

    // ---------- Primary action ----------

    @FXML
    public void onPrimary() {
        if (step == Step.ENTER_EMAIL) sendOtp();
        else verifyOtp();
    }

    private void sendOtp() {
        String email = safe(emailInput.getText());
        if (email.isBlank() || !email.contains("@")) {
            showError("Please enter a valid email address.");
            return;
        }
        String name = safe(nameInput.getText());
        // Magizhchi Share's registration also wants a mobile number — leave empty for
        // now; if the server rejects we'll surface that and add a phone field later.
        String mobileNumber = "";
        clearError();
        setBusy(true, "Sending code…");
        bg.submit(() -> {
            try {
                boolean newUser = authClient.requestOtp(email, name, mobileNumber);
                Platform.runLater(() -> {
                    isNewUserFlow = newUser;
                    step = Step.ENTER_OTP;
                    applyStep();
                    setBusy(false, null);
                    showInfo(newUser
                            ? "New account — check your email for the verification code."
                            : "Check your email — the code expires in a few minutes.");
                });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    showError(e.getMessage());
                    setBusy(false, null);
                });
            }
        });
    }

    private void verifyOtp() {
        String email = safe(emailInput.getText());
        String otp = safe(otpInput.getText());
        if (otp.length() < 4) {
            showError("Enter the code from your email.");
            return;
        }
        clearError();
        setBusy(true, "Verifying…");
        boolean newUser = isNewUserFlow;
        bg.submit(() -> {
            try {
                AuthSession session = authClient.verifyOtp(email, otp, newUser);
                if (session == null || !session.isValid()) {
                    Platform.runLater(() -> {
                        showError("Auth service returned an unexpected response.");
                        setBusy(false, null);
                    });
                    return;
                }
                if (rememberMe.isSelected()) authStore.save(session);
                Platform.runLater(() -> {
                    setBusy(false, null);
                    if (onAuthSuccess != null) onAuthSuccess.accept(session);
                });
            } catch (Exception e) {
                Platform.runLater(() -> { showError(e.getMessage()); setBusy(false, null); });
            }
        });
    }

    // ---------- UI helpers ----------

    private void setBusy(boolean busy, String label) {
        primaryButton.setDisable(busy);
        resendLink.setDisable(busy);
        changeEmailLink.setDisable(busy);
        if (label != null) primaryButton.setText(label);
        else primaryButton.setText(step == Step.ENTER_OTP ? "Verify & continue" : "Send code");
    }

    private void clearError() { errorLabel.setText(" "); errorLabel.getStyleClass().setAll("auth-error"); }

    private void showError(String msg) {
        errorLabel.setText(msg == null ? "" : msg);
        errorLabel.getStyleClass().setAll("auth-error");
        log.debug("Auth screen error: {}", msg);
    }

    private void showInfo(String msg) {
        errorLabel.setText(msg == null ? "" : msg);
        errorLabel.getStyleClass().setAll("auth-info");
    }

    private String safe(String s) { return s == null ? "" : s.trim(); }
}
