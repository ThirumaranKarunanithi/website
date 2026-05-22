package com.magizhchi.dbcommunicator;

import com.magizhchi.dbcommunicator.auth.AuthClient;
import com.magizhchi.dbcommunicator.auth.AuthProperties;
import com.magizhchi.dbcommunicator.auth.AuthSession;
import com.magizhchi.dbcommunicator.auth.AuthStore;
import com.magizhchi.dbcommunicator.ui.AuthScreenController;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.stage.Stage;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import java.io.InputStream;
import java.util.List;

public class JavaFxApp extends Application {

    private ConfigurableApplicationContext context;

    @Override
    public void init() {
        List<String> args = getParameters().getRaw();
        this.context = new SpringApplicationBuilder(MagizhchiDbCommunicatorApp.class)
                .headless(false)
                .run(args.toArray(new String[0]));
    }

    @Override
    public void start(Stage stage) throws Exception {
        // Title bar / taskbar icon — pulls from the same resource the in-app brand uses.
        try (InputStream iconStream = getClass().getResourceAsStream("/images/logo.png")) {
            if (iconStream != null) {
                stage.getIcons().add(new Image(iconStream));
            }
        } catch (Exception ignored) {
            // Logo not present — fall through; the OS will use its default app icon.
        }
        stage.setTitle("Magizhchi DB Communicator");

        AuthProperties authProps = context.getBean(AuthProperties.class);
        AuthStore authStore = context.getBean(AuthStore.class);
        AuthClient authClient = context.getBean(AuthClient.class);

        boolean alreadySignedIn = false;
        if (authProps.isEnabled()) {
            // If we have a saved session, try to validate it against the auth service.
            var existing = authStore.current();
            if (existing.isPresent()) {
                try {
                    AuthSession refreshed = authClient.verify(existing.get());
                    if (refreshed != null && refreshed.isValid()) {
                        authStore.save(refreshed);
                        alreadySignedIn = true;
                    } else {
                        authStore.clear();
                    }
                } catch (Exception e) {
                    // Auth service unreachable — trust the cached session for offline use.
                    alreadySignedIn = true;
                }
            }
        }

        if (!authProps.isEnabled() || alreadySignedIn) {
            showMainScreen(stage);
        } else {
            showAuthScreen(stage);
        }
    }

    private void showAuthScreen(Stage stage) throws Exception {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/AuthScreen.fxml"));
        loader.setControllerFactory(context::getBean);
        Parent root = loader.load();

        Scene scene = new Scene(root, 520, 720);
        scene.getStylesheets().add(getClass().getResource("/css/theme-dark.css").toExternalForm());

        AuthScreenController c = loader.getController();
        c.setOnAuthSuccess(session -> swapToMain(stage));

        stage.setScene(scene);
        stage.setMinWidth(440);
        stage.setMinHeight(620);
        stage.show();
        stage.centerOnScreen();
    }

    private void swapToMain(Stage stage) {
        try {
            showMainScreen(stage);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load main UI", e);
        }
    }

    private void showMainScreen(Stage stage) throws Exception {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/Main.fxml"));
        loader.setControllerFactory(context::getBean);
        Parent root = loader.load();

        Scene scene = new Scene(root, 1200, 700);
        scene.getStylesheets().add(getClass().getResource("/css/theme-dark.css").toExternalForm());

        stage.setScene(scene);
        stage.setMinWidth(960);
        stage.setMinHeight(560);
        stage.show();
        stage.centerOnScreen();
    }

    @Override
    public void stop() {
        if (context != null) {
            context.close();
        }
        Platform.exit();
    }
}
