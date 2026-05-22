package com.magizhchi.dbcommunicator.ui;

import com.magizhchi.dbcommunicator.ai.SqlSafetyAnalyzer;
import com.magizhchi.dbcommunicator.auth.AuthStore;
import com.magizhchi.dbcommunicator.config.ConnectionDefaults;
import com.magizhchi.dbcommunicator.config.OllamaProperties;
import com.magizhchi.dbcommunicator.db.ConnectionManager;
import com.magizhchi.dbcommunicator.db.DatabaseLister;
import com.magizhchi.dbcommunicator.db.QueryResult;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector;
import com.magizhchi.dbcommunicator.db.engine.DatabaseEngine;
import com.magizhchi.dbcommunicator.db.engine.EngineFamily;
import com.magizhchi.dbcommunicator.db.engine.EngineParams;
import com.magizhchi.dbcommunicator.db.engine.EngineRegistry;
import com.magizhchi.dbcommunicator.service.ChatResponse;
import com.magizhchi.dbcommunicator.service.ChatService;
import com.magizhchi.dbcommunicator.service.ConnectionProfile;
import com.magizhchi.dbcommunicator.service.ConnectionStore;
import javafx.application.Platform;
import javafx.beans.property.SimpleObjectProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.chart.BarChart;
import javafx.scene.chart.CategoryAxis;
import javafx.scene.chart.LineChart;
import javafx.scene.chart.NumberAxis;
import javafx.scene.chart.PieChart;
import javafx.scene.chart.XYChart;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
public class MainController {

    private static final Logger log = LoggerFactory.getLogger(MainController.class);

    private final ChatService chatService;
    private final ConnectionManager connectionManager;
    private final SchemaIntrospector schemaIntrospector;
    private final OllamaProperties ollamaProperties;
    private final ConnectionDefaults connectionDefaults;
    private final DatabaseLister databaseLister;
    private final SqlSafetyAnalyzer safetyAnalyzer;
    private final EngineRegistry engineRegistry;
    private final ConnectionStore connectionStore;
    private final AuthStore authStore;
    private DatabaseEngine currentEngine;

    private final ExecutorService background =
            Executors.newSingleThreadExecutor(r -> {
                Thread t = new Thread(r, "magizhchi-bg");
                t.setDaemon(true);
                return t;
            });

    @FXML private SplitPane chatSplit;
    @FXML private VBox resultPane;
    @FXML private ImageView logoImage;
    @FXML private ImageView creditLogoImage;
    @FXML private Label brandMark;
    @FXML private Button themeToggleButton;
    @FXML private ComboBox<String> savedProfilesCombo;
    @FXML private Button saveProfileButton;
    @FXML private Button deleteProfileButton;
    @FXML private ComboBox<String> dbTypeCombo;
    @FXML private TextField hostField;
    @FXML private TextField portField;
    @FXML private ComboBox<String> dbNameCombo;
    @FXML private Button loadDatabasesButton;
    @FXML private TextField usernameField;
    @FXML private PasswordField passwordField;
    @FXML private Button connectButton;
    @FXML private Label statusLabel;
    @FXML private Label signedInUserLabel;
    @FXML private Button signOutButton;
    @FXML private Button refreshSchemaButton;
    @FXML private ListView<String> tablesList;
    @FXML private VBox messagesBox;
    @FXML private ScrollPane chatScroll;
    @FXML private TableView<List<Object>> resultTable;
    @FXML private StackPane resultViewport;
    @FXML private ToggleButton viewTable;
    @FXML private ToggleButton viewBar;
    @FXML private ToggleButton viewPie;
    @FXML private ToggleButton viewLine;
    @FXML private ToggleGroup viewGroup;
    @FXML private Label resultMetaLabel;
    private QueryResult lastResult;
    @FXML private TextArea inputArea;
    @FXML private Button sendButton;
    @FXML private Button attachFileButton;
    private java.io.File attachedFile;
    @FXML private ToggleButton promptModeButton;
    @FXML private ToggleButton sqlModeButton;
    @FXML private Label modeHintLabel;

    public MainController(ChatService chatService,
                          ConnectionManager connectionManager,
                          SchemaIntrospector schemaIntrospector,
                          OllamaProperties ollamaProperties,
                          ConnectionDefaults connectionDefaults,
                          DatabaseLister databaseLister,
                          SqlSafetyAnalyzer safetyAnalyzer,
                          EngineRegistry engineRegistry,
                          ConnectionStore connectionStore,
                          AuthStore authStore) {
        this.chatService = chatService;
        this.connectionManager = connectionManager;
        this.schemaIntrospector = schemaIntrospector;
        this.ollamaProperties = ollamaProperties;
        this.connectionDefaults = connectionDefaults;
        this.databaseLister = databaseLister;
        this.safetyAnalyzer = safetyAnalyzer;
        this.engineRegistry = engineRegistry;
        this.connectionStore = connectionStore;
        this.authStore = authStore;
    }

    private boolean darkTheme = true;
    private boolean autoConnectEnabled = false;
    private boolean suppressProfileLoad = false;
    private boolean upgradeDialogShowing = false;

    private static final String UPGRADE_URL = "https://magizhchi.software/";

    @FXML
    public void initialize() {
        refreshSchemaButton.setDisable(true);
        tablesList.setItems(FXCollections.observableArrayList());

        // Show signed-in badge + sign-out button if there's an active auth session.
        authStore.current().ifPresent(s -> {
            signedInUserLabel.setText("👤 " + s.user().displayName());
            signOutButton.setVisible(true);
            signOutButton.setManaged(true);
        });

        // Double-click a table/collection in the sidebar to run "SELECT * FROM <table>"
        // (or the equivalent for the current engine) and view the rows.
        tablesList.setOnMouseClicked(event -> {
            if (event.getClickCount() == 2) {
                String picked = tablesList.getSelectionModel().getSelectedItem();
                if (picked != null && !picked.isBlank()) runDefaultTableQuery(picked);
            }
        });

        // Per-row right-click context menu: generate scripts + backup options.
        tablesList.setCellFactory(lv -> {
            ListCell<String> cell = new ListCell<>() {
                @Override protected void updateItem(String item, boolean empty) {
                    super.updateItem(item, empty);
                    setText(empty ? null : item);
                }
            };
            ContextMenu menu = buildTableContextMenu(cell);
            cell.emptyProperty().addListener((obs, was, now) ->
                    cell.setContextMenu(now ? null : menu));
            return cell;
        });

        loadLogo();

        // Populate the DB type dropdown from the engine registry (SQL + NoSQL).
        dbTypeCombo.getItems().setAll(engineRegistry.allDisplayNames());
        String initialType = normalizeDbType(connectionDefaults.getDbType());
        dbTypeCombo.setValue(initialType);
        currentEngine = engineRegistry.resolve(initialType);

        dbTypeCombo.valueProperty().addListener((obs, oldType, newType) -> {
            if (newType == null) return;
            currentEngine = engineRegistry.resolve(newType);
            applyTypeUiAffordances(newType);
        });
        applyTypeUiAffordances(initialType);

        applyDefault(hostField, connectionDefaults.getHost());
        applyDefault(portField, connectionDefaults.getPort());
        applyComboDefault(dbNameCombo, connectionDefaults.getDatabase());
        applyDefault(usernameField, connectionDefaults.getUsername());
        applyDefault(passwordField, connectionDefaults.getPassword());

        // HOST field is feature-gated — locked in this edition. Any edit attempt
        // pops the upgrade dialog. We leave it focusable so the value is selectable
        // (so users can still copy/inspect it).
        lockHostField();

        // Saved connection profiles — populate combo, react to selection.
        refreshSavedProfilesCombo();
        savedProfilesCombo.valueProperty().addListener((obs, old, picked) -> {
            if (suppressProfileLoad) return;
            if (picked == null || picked.isBlank()) return;
            connectionStore.findByName(picked).ifPresent(this::loadProfileIntoForm);
        });

        appendSystem("Welcome. Connect to a database, then ask anything in plain English.");
        appendSystem("Tip: this needs `ollama serve` running locally with the `" + ollamaProperties.getModel() + "` model pulled.");
        if (ollamaProperties.getModel().toLowerCase().contains("llama")) {
            appendSystem("For better SQL accuracy on large schemas, try a code-tuned model: "
                    + "`ollama pull sqlcoder` (or `deepseek-coder`), then set "
                    + "`magizhchi.ollama.model` in application.yml.");
        }

        inputArea.addEventFilter(KeyEvent.KEY_PRESSED, this::onInputKey);

        // Start with the result pane collapsed so the chat + prompt input get full height.
        setResultPaneVisible(false);

        // Result-view toggle: switch between table / bar / pie / line. Keep one always selected.
        viewGroup.selectedToggleProperty().addListener((obs, was, now) -> {
            if (now == null && was != null) {
                ((ToggleButton) was).setSelected(true);
            } else {
                applyResultViewMode();
            }
        });

        // Toggle group ensures one mode is always selected; react to changes.
        promptModeButton.selectedProperty().addListener((o, was, now) -> {
            if (Boolean.TRUE.equals(now)) applyPromptMode();
        });
        sqlModeButton.selectedProperty().addListener((o, was, now) -> {
            if (Boolean.TRUE.equals(now)) applySqlMode();
        });
        applyPromptMode();

        // Auto-connect + refresh the tables sidebar whenever the user picks a
        // database from the combo (or types one and presses Enter).
        dbNameCombo.valueProperty().addListener((obs, oldVal, newVal) -> {
            if (!autoConnectEnabled) return;
            if (newVal == null || newVal.isBlank()) return;
            if (newVal.equals(oldVal)) return;
            connectInBackground();
        });
        autoConnectEnabled = true;
    }

    private void setResultPaneVisible(boolean visible) {
        resultPane.setVisible(visible);
        resultPane.setManaged(visible);
        // Push the divider all the way down so the chat takes 100% of the split area.
        if (chatSplit != null && chatSplit.getDividers().size() > 0) {
            chatSplit.setDividerPositions(visible ? 0.6 : 1.0);
        }
    }

    // ---------- Result pane resize controls -------------------------------------

    /** Remembered divider position before a maximize, so toggling restores it. */
    private double rememberedDividerPosition = 0.6;

    @FXML
    public void onResultGrow() { adjustResultDivider(-0.10); }

    @FXML
    public void onResultShrink() { adjustResultDivider(+0.10); }

    @FXML
    public void onResultMaximize() {
        if (chatSplit == null || chatSplit.getDividers().isEmpty()) return;
        double current = chatSplit.getDividerPositions()[0];
        if (current > 0.20) {
            // Currently small/medium → remember and maximize.
            rememberedDividerPosition = current;
            chatSplit.setDividerPositions(0.15);
        } else {
            // Currently maximized → restore.
            chatSplit.setDividerPositions(rememberedDividerPosition);
        }
    }

    /** delta &lt; 0 makes the result pane larger; &gt; 0 makes it smaller. */
    private void adjustResultDivider(double delta) {
        if (chatSplit == null || chatSplit.getDividers().isEmpty()) return;
        // Make sure the result pane is at least visible (in case the user
        // hits +/- before running a query).
        if (!resultPane.isManaged()) setResultPaneVisible(true);
        double current = chatSplit.getDividerPositions()[0];
        double next = Math.max(0.10, Math.min(0.95, current + delta));
        chatSplit.setDividerPositions(next);
    }

    /**
     * Try to load /images/logo.png. If present, show the ImageView and hide the
     * fallback ✦ Label. If missing, do the opposite.
     *
     * Also load /images/magizhchi-software-logo.png for the credit-line slot
     * (bottom right, next to "Created by Magizhchi Software"). If absent we
     * silently hide that slot so the credit text still shows by itself.
     */
    private void loadLogo() {
        // Main brand logo (Magizhchi DB Communicator coin) — used in heading + title bar.
        // Loaded at 2× the display height (168 px) with smooth=true for crisp HiDPI rendering.
        var mainStream = getClass().getResourceAsStream("/images/logo.png");
        if (mainStream != null) {
            try {
                logoImage.setImage(new Image(mainStream, 0, 180, true, true));
                logoImage.setSmooth(true);
                logoImage.setCache(true);
                brandMark.setVisible(false);
                brandMark.setManaged(false);
            } catch (Exception e) {
                log.warn("Failed to decode /images/logo.png: {}", e.getMessage());
                hideNode(logoImage);
            }
        } else {
            hideNode(logoImage);
        }

        // Corporate logo (Magizhchi Software smiley) next to the credit hyperlink.
        // Displayed at 18 px — load at 72 px (4×) so it stays sharp.
        var creditStream = getClass().getResourceAsStream("/images/magizhchi-software-logo.png");
        if (creditStream != null) {
            try {
                creditLogoImage.setImage(new Image(creditStream, 0, 72, true, true));
                creditLogoImage.setSmooth(true);
                creditLogoImage.setCache(true);
            } catch (Exception e) {
                log.warn("Failed to decode /images/magizhchi-software-logo.png: {}", e.getMessage());
                hideNode(creditLogoImage);
            }
        } else {
            hideNode(creditLogoImage);
        }
    }

    private void hideNode(javafx.scene.Node n) {
        n.setVisible(false);
        n.setManaged(false);
    }

    @FXML
    public void onToggleTheme() {
        Scene scene = themeToggleButton.getScene();
        if (scene == null) return;
        String dark = getClass().getResource("/css/theme-dark.css").toExternalForm();
        String light = getClass().getResource("/css/theme-light.css").toExternalForm();
        darkTheme = !darkTheme;
        scene.getStylesheets().setAll(darkTheme ? dark : light);
        themeToggleButton.setText(darkTheme ? "☀" : "🌙");
    }

    private void applyDefault(TextField field, String value) {
        if (value != null && !value.isEmpty()) field.setText(value);
    }

    private void applyComboDefault(ComboBox<String> combo, String value) {
        if (value != null && !value.isEmpty()) {
            combo.setValue(value);
            combo.getEditor().setText(value);
        }
    }

    private void onInputKey(KeyEvent e) {
        // Ctrl+Enter (or Cmd+Enter) sends; plain Enter inserts newline.
        if (e.getCode() == KeyCode.ENTER && (e.isControlDown() || e.isMetaDown())) {
            onSend();
            e.consume();
        }
    }

    // ---------- Connection -----------------------------------------------------

    @FXML
    public void onConnect() {
        connectInBackground();
    }

    /** Reads current field values, connects via the active engine, repopulates the sidebar. */
    private void connectInBackground() {
        if (currentEngine == null) {
            appendSystem("Pick a database TYPE first.");
            return;
        }
        String dbType = safe(dbTypeCombo.getValue(), "PostgreSQL");
        boolean fileBased = currentEngine.isFileBased(dbType);
        String host = safe(hostField.getText(), "localhost");
        String port = safe(portField.getText(), currentEngine.defaultPort(dbType));
        String dbName = safe(currentDbName(), "");
        String user = safe(usernameField.getText(), "");
        String pass = passwordField.getText() == null ? "" : passwordField.getText();

        if (!fileBased && !port.matches("\\d+")) {
            appendSystem("Port must be a number.");
            return;
        }
        if (fileBased && dbName.isBlank()) {
            appendSystem("For " + dbType + ", enter the database file path in the DATABASE field.");
            return;
        }

        EngineParams params = new EngineParams(dbType, host, port, dbName, user, pass);

        connectButton.setDisable(true);
        statusLabel.setText("Connecting…");
        statusLabel.getStyleClass().setAll("status-pill", "status-pending");
        tablesList.getItems().clear();

        background.submit(() -> {
            try {
                currentEngine.connect(params);
                currentEngine.invalidateSchemaCache();
                SchemaIntrospector.SchemaSnapshot snap = currentEngine.introspectSchema();
                Platform.runLater(() -> {
                    statusLabel.setText("Connected · " + currentEngine.connectionDisplayName());
                    statusLabel.getStyleClass().setAll("status-pill", "status-connected");
                    tablesList.getItems().setAll(
                            snap.tables().stream().map(SchemaIntrospector.TableInfo::qualifiedName).toList()
                    );
                    refreshSchemaButton.setDisable(false);
                    appendSystem("Connected to " + currentEngine.connectionDisplayName()
                            + ". Loaded " + snap.tables().size() + " "
                            + (currentEngine.family().name().equals("SQL") ? "tables/views" : "collections/keys") + ".");
                });
            } catch (Exception ex) {
                Platform.runLater(() -> {
                    statusLabel.setText("Disconnected");
                    statusLabel.getStyleClass().setAll("status-pill", "status-disconnected");
                    appendSystem("Connection failed: " + ex.getMessage());
                });
            } finally {
                Platform.runLater(() -> connectButton.setDisable(false));
            }
        });
    }

    // ---------- HOST field feature-gate ----------------------------------------

    /**
     * The HOST field is read-only in this edition. We keep it focusable for
     * copying / inspection but every interaction that signals "I want to change
     * this" fires the upgrade dialog.
     */
    private void lockHostField() {
        hostField.setEditable(false);
        hostField.setTooltip(new Tooltip("Host changes require an upgrade — click for details."));

        // Any click on the field shows the upgrade prompt.
        hostField.setOnMousePressed(e -> showUpgradeDialog());

        // Keyboard edits (in case the user tabs into the field) also fire the prompt.
        hostField.addEventFilter(KeyEvent.KEY_PRESSED, e -> {
            if (e.isControlDown() || e.isMetaDown() || e.isAltDown()) return;   // allow Ctrl+C, etc.
            KeyCode k = e.getCode();
            if (k.isLetterKey() || k.isDigitKey() || k.isWhitespaceKey()
                    || k == KeyCode.BACK_SPACE || k == KeyCode.DELETE
                    || k == KeyCode.PERIOD || k == KeyCode.MINUS) {
                e.consume();
                showUpgradeDialog();
            }
        });

        // Right-click "paste" attempt also fires the prompt.
        hostField.setOnContextMenuRequested(e -> { e.consume(); showUpgradeDialog(); });
    }

    private void showUpgradeDialog() {
        if (upgradeDialogShowing) return;
        upgradeDialogShowing = true;
        try {
            ButtonType upgrade = new ButtonType("Open magizhchi.software ↗", ButtonBar.ButtonData.OK_DONE);
            ButtonType cancel = new ButtonType("Not now", ButtonBar.ButtonData.CANCEL_CLOSE);
            Alert alert = new Alert(Alert.AlertType.INFORMATION,
                    "Changing the HOST is a premium feature.\n\n"
                            + "Visit " + UPGRADE_URL + " to unlock multi-host connections, "
                            + "remote deployments, and more.",
                    upgrade, cancel);
            alert.setTitle("Upgrade required");
            alert.setHeaderText("Host changes require an upgrade");
            alert.showAndWait().ifPresent(bt -> {
                if (bt == upgrade) openUrl(UPGRADE_URL);
            });
        } finally {
            upgradeDialogShowing = false;
        }
    }

    @FXML
    public void onOpenWebsite() {
        openUrl(UPGRADE_URL);
    }

    @FXML
    public void onSignOut() {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION,
                "Sign out of your Magizhchi account? You'll need to sign in again to keep using "
                        + "shared services.",
                ButtonType.YES, ButtonType.CANCEL);
        confirm.setHeaderText("Sign out");
        if (confirm.showAndWait().orElse(ButtonType.CANCEL) != ButtonType.YES) return;

        authStore.clear();
        if (currentEngine != null) currentEngine.disconnect();

        // Close the window — the user can relaunch to reach the sign-in screen,
        // or we restart inside the same JVM. Simplest cross-platform path is to exit.
        Platform.exit();
    }

    private void openUrl(String url) {
        try {
            // java.awt.Desktop works on Win/Mac/Linux and is part of the JDK,
            // so we avoid a runtime dependency on JavaFX HostServices wiring.
            if (java.awt.Desktop.isDesktopSupported()
                    && java.awt.Desktop.getDesktop().isSupported(java.awt.Desktop.Action.BROWSE)) {
                java.awt.Desktop.getDesktop().browse(java.net.URI.create(url));
            } else {
                appendSystem("Browser launch not supported on this OS. Visit " + url + " manually.");
            }
        } catch (Exception ex) {
            appendSystem("Could not open browser: " + ex.getMessage() + ". Visit " + url + " manually.");
        }
    }

    // ---------- Saved connection profiles --------------------------------------

    private void refreshSavedProfilesCombo() {
        suppressProfileLoad = true;
        try {
            String previous = savedProfilesCombo.getValue();
            savedProfilesCombo.getItems().setAll(connectionStore.names());
            if (previous != null && savedProfilesCombo.getItems().contains(previous)) {
                savedProfilesCombo.setValue(previous);
            } else {
                savedProfilesCombo.setValue(null);
            }
            deleteProfileButton.setDisable(savedProfilesCombo.getValue() == null);
        } finally {
            suppressProfileLoad = false;
        }
    }

    private void loadProfileIntoForm(ConnectionProfile p) {
        // Disable auto-connect while we batch-set fields, otherwise picking a saved profile
        // would fire the dbNameCombo listener mid-load and connect to the previous engine.
        boolean prevAutoConnect = autoConnectEnabled;
        autoConnectEnabled = false;
        try {
            if (p.dbType() != null) dbTypeCombo.setValue(p.dbType());
            if (p.host() != null) hostField.setText(p.host());
            if (p.port() != null) portField.setText(p.port());
            if (p.username() != null) usernameField.setText(p.username());
            if (p.password() != null) passwordField.setText(p.password());
            if (p.database() != null) {
                dbNameCombo.setValue(p.database());
                dbNameCombo.getEditor().setText(p.database());
            }
        } finally {
            autoConnectEnabled = prevAutoConnect;
        }
        deleteProfileButton.setDisable(false);
        appendSystem("Loaded saved connection \"" + p.name() + "\". Click Connect to open.");
    }

    @FXML
    public void onSaveProfile() {
        TextInputDialog dialog = new TextInputDialog(suggestedProfileName());
        dialog.setTitle("Save connection");
        dialog.setHeaderText("Save current connection settings");
        dialog.setContentText("Profile name:");
        dialog.showAndWait().ifPresent(rawName -> {
            String name = rawName.trim();
            if (name.isEmpty()) return;

            if (connectionStore.findByName(name).isPresent()) {
                Alert confirm = new Alert(Alert.AlertType.CONFIRMATION,
                        "A saved connection named \"" + name + "\" already exists. Overwrite?",
                        ButtonType.YES, ButtonType.NO);
                confirm.setHeaderText("Overwrite existing profile?");
                if (confirm.showAndWait().orElse(ButtonType.NO) != ButtonType.YES) return;
            }

            ConnectionProfile p = new ConnectionProfile(
                    name,
                    safe(dbTypeCombo.getValue(), "PostgreSQL"),
                    hostField.getText(),
                    portField.getText(),
                    currentDbName(),
                    usernameField.getText(),
                    passwordField.getText() == null ? "" : passwordField.getText()
            );
            try {
                connectionStore.save(p);
                refreshSavedProfilesCombo();
                suppressProfileLoad = true;
                try { savedProfilesCombo.setValue(name); } finally { suppressProfileLoad = false; }
                appendSystem("Saved connection \"" + name + "\".");
            } catch (Exception ex) {
                appendSystem("Could not save: " + ex.getMessage());
            }
        });
    }

    @FXML
    public void onDeleteProfile() {
        String name = savedProfilesCombo.getValue();
        if (name == null || name.isBlank()) return;
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION,
                "Delete saved connection \"" + name + "\"?",
                ButtonType.YES, ButtonType.CANCEL);
        confirm.setHeaderText("Delete this profile?");
        if (confirm.showAndWait().orElse(ButtonType.CANCEL) != ButtonType.YES) return;
        if (connectionStore.delete(name)) {
            refreshSavedProfilesCombo();
            appendSystem("Deleted saved connection \"" + name + "\".");
        }
    }

    private String suggestedProfileName() {
        String t = safe(dbTypeCombo.getValue(), "DB");
        String h = safe(hostField.getText(), "localhost");
        String d = safe(currentDbName(), "");
        return (d.isBlank() ? t + " @ " + h : t + " @ " + h + "/" + d);
    }

    /** Reads the currently-shown database name from the combo (typed or selected). */
    private String currentDbName() {
        String editor = dbNameCombo.getEditor() == null ? null : dbNameCombo.getEditor().getText();
        if (editor != null && !editor.isBlank()) return editor;
        return dbNameCombo.getValue();
    }

    /** Click the ↻ button: fetch the list of databases from the server. */
    @FXML
    public void onLoadDatabases() {
        if (currentEngine == null) {
            appendSystem("Pick a database TYPE first.");
            return;
        }
        String dbType = safe(dbTypeCombo.getValue(), "PostgreSQL");
        if (currentEngine.isFileBased(dbType)) {
            appendSystem(dbType + " is file-based — type the file path into the DATABASE field.");
            return;
        }
        String host = safe(hostField.getText(), "localhost");
        String port = safe(portField.getText(), currentEngine.defaultPort(dbType));
        String user = safe(usernameField.getText(), "");
        String pass = passwordField.getText() == null ? "" : passwordField.getText();

        if (!port.matches("\\d+")) {
            appendSystem("Port must be a number.");
            return;
        }

        loadDatabasesButton.setDisable(true);
        String previous = currentDbName();
        EngineParams params = new EngineParams(dbType, host, port, "", user, pass);

        background.submit(() -> {
            try {
                List<String> dbs = currentEngine.listDatabases(params);
                Platform.runLater(() -> {
                    boolean wasEnabled = autoConnectEnabled;
                    autoConnectEnabled = false;       // don't auto-connect on programmatic setValue
                    try {
                        dbNameCombo.getItems().setAll(dbs);
                        // Preserve whatever the user already had typed/selected if it still exists.
                        if (previous != null && dbs.contains(previous)) {
                            dbNameCombo.setValue(previous);
                        } else if (!dbs.isEmpty()) {
                            dbNameCombo.setValue(dbs.get(0));
                        }
                    } finally {
                        autoConnectEnabled = wasEnabled;
                    }
                    dbNameCombo.show();
                    appendSystem("Loaded " + dbs.size() + " database(s) from " + host + ":" + port
                            + ". Pick one to connect.");
                });
            } catch (Exception ex) {
                Platform.runLater(() ->
                        appendSystem("Could not list databases: " + ex.getMessage()));
            } finally {
                Platform.runLater(() -> loadDatabasesButton.setDisable(false));
            }
        });
    }

    @FXML
    public void onRefreshSchema() {
        if (currentEngine == null || !currentEngine.isConnected()) {
            appendSystem("Connect first.");
            return;
        }
        refreshSchemaButton.setDisable(true);
        background.submit(() -> {
            currentEngine.invalidateSchemaCache();
            SchemaIntrospector.SchemaSnapshot snap = currentEngine.introspectSchema();
            Platform.runLater(() -> {
                tablesList.getItems().setAll(
                        snap.tables().stream().map(SchemaIntrospector.TableInfo::qualifiedName).toList()
                );
                refreshSchemaButton.setDisable(false);
                appendSystem("Schema refreshed — " + snap.tables().size() + " item(s).");
            });
        });
    }

    // ---------- Chat / SQL generation -----------------------------------------

    private void applyPromptMode() {
        sendButton.setText("Send");
        inputArea.setPromptText("Ask the database in plain English…  (e.g. show all employees joined after 2022)");
        modeHintLabel.setText("AI will generate SQL from your question");
    }

    private void applySqlMode() {
        sendButton.setText("Run SQL");
        inputArea.setPromptText("Paste or type SQL to run directly…  (skips the AI; runs as-is)");
        modeHintLabel.setText("SQL runs as-is — no AI, no schema-checking");
    }

    @FXML
    public void onSend() {
        String message = inputArea.getText();
        boolean hasFile = attachedFile != null;
        if ((message == null || message.isBlank()) && !hasFile) return;
        inputArea.clear();

        if (hasFile) {
            java.io.File file = attachedFile;
            attachedFile = null;     // consume — one-shot per Send
            handleAttachedFile(file, message == null ? "" : message);
            return;
        }

        if (sqlModeButton.isSelected()) {
            sendAsSql(message);
        } else {
            sendAsPrompt(message);
        }
    }

    @FXML
    public void onAttachFile() {
        javafx.stage.FileChooser chooser = new javafx.stage.FileChooser();
        chooser.setTitle("Attach a file");
        chooser.getExtensionFilters().addAll(
                new javafx.stage.FileChooser.ExtensionFilter("SQL & backups", "*.sql", "*.backup", "*.dump"),
                new javafx.stage.FileChooser.ExtensionFilter("All files", "*.*")
        );
        java.io.File f = chooser.showOpenDialog(attachFileButton.getScene().getWindow());
        if (f == null) return;
        attachedFile = f;
        long kb = Math.max(1, f.length() / 1024);
        appendSystem("📎 Attached: " + f.getName() + "  (" + kb + " KB) — type a message (e.g. \"restore\") and press Send.");
    }

    /** Route an attached file based on its extension. */
    private void handleAttachedFile(java.io.File file, String userMessage) {
        String header = userMessage.isBlank() ? "[📎 " + file.getName() + "]"
                                              : userMessage + "\n[📎 " + file.getName() + "]";
        appendUser(header);

        if (currentEngine == null || !currentEngine.isConnected()) {
            appendSystem("Connect to a database first.");
            return;
        }

        String lower = file.getName().toLowerCase();
        if (lower.endsWith(".backup") || lower.endsWith(".dump")) {
            runPgRestore(file);
        } else if (lower.endsWith(".sql")) {
            executeSqlFile(file);
        } else {
            appendSystem("Unsupported file type. Use .sql to execute, or .backup/.dump to restore.");
        }
    }

    /**
     * Shell out to {@code pg_restore} using the current PostgreSQL connection's
     * host/port/user/db. The CLI tool must be on PATH (it ships with the Postgres
     * client install). Password is passed via PGPASSWORD env var so it doesn't
     * appear in process listings.
     */
    private void runPgRestore(java.io.File file) {
        String dbType = safe(dbTypeCombo.getValue(), "PostgreSQL");
        if (!"PostgreSQL".equalsIgnoreCase(dbType)) {
            appendSystem("Restoring from a .backup is only supported for PostgreSQL connections.");
            return;
        }
        String host = safe(hostField.getText(), "localhost");
        String port = safe(portField.getText(), "5432");
        String user = safe(usernameField.getText(), "postgres");
        String pass = passwordField.getText() == null ? "" : passwordField.getText();
        String db = safe(currentDbName(), "");
        if (db.isBlank()) {
            appendSystem("Pick a target database in the DATABASE field before restoring.");
            return;
        }

        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION,
                "Restore\n  " + file.getAbsolutePath()
                        + "\ninto database\n  " + db
                        + "\non\n  " + host + ":" + port
                        + "\n\nThis runs the external `pg_restore` tool and may overwrite existing data.",
                ButtonType.YES, ButtonType.CANCEL);
        confirm.setHeaderText("Confirm database restore");
        if (confirm.showAndWait().orElse(ButtonType.CANCEL) != ButtonType.YES) return;

        String pgRestoreExe = findPgRestoreExecutable();
        if (pgRestoreExe == null) {
            appendSystem("Could not find `pg_restore`. Install PostgreSQL client tools from "
                    + "https://www.postgresql.org/download/ — or, if PostgreSQL is already installed, "
                    + "add its `bin` directory (e.g. `C:\\Program Files\\PostgreSQL\\17\\bin`) to your PATH "
                    + "and restart the app.");
            return;
        }

        Label running = appendSystem("Running pg_restore (" + pgRestoreExe + ")… this may take a while.");
        sendButton.setDisable(true);
        background.submit(() -> {
            StringBuilder output = new StringBuilder();
            int exitCode = -1;
            String error = null;
            try {
                ProcessBuilder pb = new ProcessBuilder(
                        pgRestoreExe,
                        "-h", host,
                        "-p", port,
                        "-U", user,
                        "-d", db,
                        "--no-owner", "--no-privileges",
                        file.getAbsolutePath()
                );
                pb.environment().put("PGPASSWORD", pass);
                pb.redirectErrorStream(true);
                Process p = pb.start();
                try (java.io.BufferedReader br = new java.io.BufferedReader(
                        new java.io.InputStreamReader(p.getInputStream()))) {
                    String line;
                    int lines = 0;
                    while ((line = br.readLine()) != null) {
                        output.append(line).append("\n");
                        if (++lines > 200) {
                            output.append("…(output truncated; check pg_restore log for full output)\n");
                            break;
                        }
                    }
                }
                exitCode = p.waitFor();
            } catch (java.io.IOException ioe) {
                error = "Could not launch pg_restore. Make sure PostgreSQL client tools are installed "
                      + "and `pg_restore` is on your PATH. Underlying error: " + ioe.getMessage();
            } catch (Exception e) {
                error = e.getMessage();
            }

            final String summary = (error != null) ? error
                    : (exitCode == 0)
                        ? "✓ Restore complete.\n" + (output.length() > 0 ? output.toString() : "")
                        : "✗ pg_restore exited with code " + exitCode + ":\n" + output;
            final boolean success = (error == null) && (exitCode == 0);
            Platform.runLater(() -> {
                messagesBox.getChildren().remove(running);
                appendSystem(summary);
                sendButton.setDisable(false);
                if (success) {
                    currentEngine.invalidateSchemaCache();
                    onRefreshSchema();
                }
            });
        });
    }

    /** Cache resolved Postgres tool paths so we don't rescan on every invocation. */
    private final java.util.Map<String, String> postgresToolCache = new java.util.HashMap<>();

    private String findPgRestoreExecutable() { return findPostgresExecutable("pg_restore"); }

    /**
     * Locate a PostgreSQL client tool (pg_restore, pg_dump, psql, ...) by checking
     * PATH first, then common Windows / macOS / Linux install directories.
     * Returns null if not found.
     */
    private String findPostgresExecutable(String toolName) {
        if (postgresToolCache.containsKey(toolName)) return postgresToolCache.get(toolName);

        // 1. Try PATH (the normal case).
        try {
            Process p = new ProcessBuilder(toolName, "--version")
                    .redirectErrorStream(true).start();
            if (p.waitFor() == 0) {
                postgresToolCache.put(toolName, toolName);
                return toolName;
            }
        } catch (Exception ignored) {}

        // 2. Scan common install roots based on OS.
        String os = System.getProperty("os.name", "").toLowerCase();
        java.util.List<String> roots = new java.util.ArrayList<>();
        String exeName = toolName;
        if (os.contains("win")) {
            exeName = toolName + ".exe";
            roots.add("C:\\Program Files\\PostgreSQL");
            roots.add("C:\\Program Files (x86)\\PostgreSQL");
        } else if (os.contains("mac")) {
            roots.add("/Library/PostgreSQL");
            roots.add("/usr/local/Cellar/postgresql");
            roots.add("/opt/homebrew/Cellar/postgresql");
        } else {
            roots.add("/usr/pgsql");
            roots.add("/usr/local/pgsql");
        }

        for (String root : roots) {
            java.io.File rootDir = new java.io.File(root);
            if (!rootDir.exists() || !rootDir.isDirectory()) continue;
            java.io.File[] versions = rootDir.listFiles(java.io.File::isDirectory);
            if (versions == null) continue;
            java.util.Arrays.sort(versions, (a, b) -> b.getName().compareTo(a.getName()));
            for (java.io.File v : versions) {
                java.io.File candidate = new java.io.File(v, "bin" + java.io.File.separator + exeName);
                if (candidate.isFile() && candidate.canExecute()) {
                    log.info("Found {} at {}", toolName, candidate.getAbsolutePath());
                    String resolved = candidate.getAbsolutePath();
                    postgresToolCache.put(toolName, resolved);
                    return resolved;
                }
            }
        }

        // 3. Last-resort fixed paths on Unix-likes.
        for (String p : new String[]{"/usr/bin/" + toolName, "/usr/local/bin/" + toolName, "/opt/homebrew/bin/" + toolName}) {
            java.io.File f = new java.io.File(p);
            if (f.isFile() && f.canExecute()) {
                postgresToolCache.put(toolName, p);
                return p;
            }
        }
        postgresToolCache.put(toolName, null);
        return null;
    }

    /** Read a .sql file from disk and execute its contents against the active engine. */
    private void executeSqlFile(java.io.File file) {
        try {
            String sql = java.nio.file.Files.readString(file.toPath());
            if (sql.isBlank()) {
                appendSystem("File is empty.");
                return;
            }
            appendSystem("Executing SQL from " + file.getName()
                    + " (" + (sql.length() / 1024 + 1) + " KB)…");
            executeRawSql(sql);
        } catch (Exception e) {
            appendSystem("Failed to read " + file.getName() + ": " + e.getMessage());
        }
    }

    /** Original flow: send to LLM, render generated SQL with Run button. */
    private void sendAsPrompt(String message) {
        appendUser(message);
        Label thinking = appendSystem("Thinking…");
        sendButton.setDisable(true);

        String dbType = safe(dbTypeCombo.getValue(), connectionManager.getDbType());
        SchemaIntrospector.SchemaSnapshot schema =
                currentEngine != null && currentEngine.isConnected() ? currentEngine.introspectSchema() : null;

        background.submit(() -> {
            ChatResponse resp = chatService.generate(message, currentEngine, dbType, schema);
            Platform.runLater(() -> {
                messagesBox.getChildren().remove(thinking);
                renderResponse(resp);
                sendButton.setDisable(false);
            });
        });
    }

    /** Direct flow: skip the LLM, run the user's raw SQL after a safety check. */
    private void sendAsSql(String sql) {
        appendUserSql(sql);

        if (currentEngine == null || !currentEngine.isConnected()) {
            appendSystem("Connect to a database first.");
            return;
        }

        SqlSafetyAnalyzer.Analysis safety = safetyAnalyzer.analyze(sql);
        if (safety.requiresConfirmation()) {
            Alert alert = new Alert(Alert.AlertType.CONFIRMATION,
                    "This query is flagged as " + safety.level() + ".\n\n"
                            + String.join("\n", safety.warnings())
                            + "\n\nRun anyway?",
                    ButtonType.YES, ButtonType.CANCEL);
            alert.setHeaderText("Confirm potentially destructive query");
            alert.showAndWait().ifPresent(bt -> {
                if (bt == ButtonType.YES) executeRawSql(sql);
            });
        } else {
            executeRawSql(sql);
        }
    }

    /**
     * Double-clicked a row in the TABLES sidebar — build a default "show
     * everything in this table" query for the current engine and run it.
     */
    private void runDefaultTableQuery(String pickedTable) {
        if (currentEngine == null || !currentEngine.isConnected()) {
            appendSystem("Connect to a database first.");
            return;
        }
        String query = buildDefaultTableQuery(pickedTable);
        if (query == null) {
            appendSystem("Auto-query is not supported for " + currentEngine.queryLanguageName()
                    + " yet — type the command manually.");
            return;
        }
        appendUserSql(query);
        executeRawSql(query);
    }

    /** Builds the right-click menu for a TABLES-sidebar cell. */
    private ContextMenu buildTableContextMenu(ListCell<String> cell) {
        ContextMenu menu = new ContextMenu();

        MenuItem selectItem = new MenuItem("Generate SELECT script");
        selectItem.setOnAction(e -> generateScript("SELECT", cell.getItem()));

        MenuItem insertItem = new MenuItem("Generate INSERT script");
        insertItem.setOnAction(e -> generateScript("INSERT", cell.getItem()));

        MenuItem updateItem = new MenuItem("Generate UPDATE script");
        updateItem.setOnAction(e -> generateScript("UPDATE", cell.getItem()));

        MenuItem deleteItem = new MenuItem("Generate DELETE script");
        deleteItem.setOnAction(e -> generateScript("DELETE", cell.getItem()));

        SeparatorMenuItem sep = new SeparatorMenuItem();

        MenuItem backupTableItem = new MenuItem("💾 Backup this table…");
        backupTableItem.setOnAction(e -> backupToFile(cell.getItem()));

        MenuItem backupDbItem = new MenuItem("💾 Backup full database…");
        backupDbItem.setOnAction(e -> backupToFile(null));

        menu.getItems().addAll(selectItem, insertItem, updateItem, deleteItem,
                sep, backupTableItem, backupDbItem);
        return menu;
    }

    // ---------- Script generation ----------

    private void generateScript(String op, String tableQualifiedName) {
        if (tableQualifiedName == null) return;
        if (currentEngine == null || !currentEngine.isConnected()) {
            appendSystem("Connect to a database first.");
            return;
        }
        SchemaIntrospector.SchemaSnapshot snap = currentEngine.introspectSchema();
        SchemaIntrospector.TableInfo table = findTableInfo(snap, tableQualifiedName);
        if (table == null) {
            appendSystem("Could not find `" + tableQualifiedName + "` in the loaded schema.");
            return;
        }
        String sql = switch (op) {
            case "SELECT" -> buildSelectScript(table);
            case "INSERT" -> buildInsertScript(table);
            case "UPDATE" -> buildUpdateScript(table);
            case "DELETE" -> buildDeleteScript(table);
            default -> "";
        };
        appendUserSql(sql);
    }

    private SchemaIntrospector.TableInfo findTableInfo(SchemaIntrospector.SchemaSnapshot snap, String qualified) {
        for (SchemaIntrospector.TableInfo t : snap.tables()) {
            if (t.qualifiedName().equalsIgnoreCase(qualified)) return t;
        }
        return null;
    }

    private String buildSelectScript(SchemaIntrospector.TableInfo t) {
        String cols = t.columns().stream()
                .map(SchemaIntrospector.ColumnInfo::name)
                .collect(java.util.stream.Collectors.joining(", "));
        return "SELECT " + cols + "\nFROM " + t.qualifiedName() + "\nLIMIT 100;";
    }

    private String buildInsertScript(SchemaIntrospector.TableInfo t) {
        String cols = t.columns().stream()
                .map(SchemaIntrospector.ColumnInfo::name)
                .collect(java.util.stream.Collectors.joining(", "));
        String values = t.columns().stream()
                .map(c -> placeholderForType(c.type()))
                .collect(java.util.stream.Collectors.joining(", "));
        return "INSERT INTO " + t.qualifiedName() + " (" + cols + ")\nVALUES (" + values + ");";
    }

    private String buildUpdateScript(SchemaIntrospector.TableInfo t) {
        String pk = guessPrimaryKey(t);
        StringBuilder sb = new StringBuilder("UPDATE ").append(t.qualifiedName()).append("\nSET");
        boolean first = true;
        for (SchemaIntrospector.ColumnInfo c : t.columns()) {
            if (c.name().equalsIgnoreCase(pk)) continue;
            sb.append(first ? "\n  " : ",\n  ");
            sb.append(c.name()).append(" = ").append(placeholderForType(c.type()));
            first = false;
        }
        sb.append("\nWHERE ").append(pk).append(" = 0;  -- replace 0 with the row's key");
        return sb.toString();
    }

    private String buildDeleteScript(SchemaIntrospector.TableInfo t) {
        String pk = guessPrimaryKey(t);
        return "DELETE FROM " + t.qualifiedName()
                + "\nWHERE " + pk + " = 0;  -- replace 0 with the row's key";
    }

    /** Heuristic: prefer `id`, then `<tablename>_id`, then the first column. */
    private String guessPrimaryKey(SchemaIntrospector.TableInfo t) {
        if (t.columns().isEmpty()) return "id";
        for (SchemaIntrospector.ColumnInfo c : t.columns()) {
            if (c.name().equalsIgnoreCase("id")) return c.name();
        }
        String base = t.name();
        for (SchemaIntrospector.ColumnInfo c : t.columns()) {
            if (c.name().equalsIgnoreCase(base + "_id")) return c.name();
        }
        return t.columns().get(0).name();
    }

    /** Pick a syntactically valid placeholder literal for a column type. */
    private String placeholderForType(String type) {
        String t = type == null ? "" : type.toLowerCase();
        if (t.contains("bool")) return "FALSE";
        if (t.contains("int") || t.contains("num") || t.contains("dec")
                || t.contains("float") || t.contains("double") || t.contains("real")) return "0";
        if (t.contains("date") || t.contains("time")) return "CURRENT_TIMESTAMP";
        return "''";
    }

    // ---------- Database / table backup ----------

    /**
     * Run pg_dump on the active PostgreSQL connection, writing to a user-chosen
     * file. If {@code tableQualifiedName} is non-null, only that table is dumped;
     * otherwise the whole database is dumped.
     */
    private void backupToFile(String tableQualifiedName) {
        String dbType = safe(dbTypeCombo.getValue(), "PostgreSQL");
        if (!"PostgreSQL".equalsIgnoreCase(dbType)) {
            appendSystem("Backup currently only supports PostgreSQL connections.");
            return;
        }
        if (currentEngine == null || !currentEngine.isConnected()) {
            appendSystem("Connect to a database first.");
            return;
        }
        String host = safe(hostField.getText(), "localhost");
        String port = safe(portField.getText(), "5432");
        String user = safe(usernameField.getText(), "postgres");
        String pass = passwordField.getText() == null ? "" : passwordField.getText();
        String db = safe(currentDbName(), "");
        if (db.isBlank()) {
            appendSystem("Pick a database in the DATABASE field before backing up.");
            return;
        }

        // Ask the user where to save.
        javafx.stage.FileChooser fc = new javafx.stage.FileChooser();
        fc.setTitle(tableQualifiedName == null
                ? "Backup full database — choose output file"
                : "Backup table " + tableQualifiedName + " — choose output file");
        String stamp = java.time.LocalDate.now().toString();
        String name = (tableQualifiedName == null ? db : db + "_" + tableQualifiedName.replace('.', '_'))
                + "_" + stamp + ".backup";
        fc.setInitialFileName(name);
        fc.getExtensionFilters().add(new javafx.stage.FileChooser.ExtensionFilter(
                "PostgreSQL custom-format backup", "*.backup", "*.dump"));
        java.io.File out = fc.showSaveDialog(tablesList.getScene().getWindow());
        if (out == null) return;

        String pgDumpExe = findPostgresExecutable("pg_dump");
        if (pgDumpExe == null) {
            appendSystem("Could not find `pg_dump`. Install PostgreSQL client tools or add its `bin` "
                    + "directory (e.g. `C:\\Program Files\\PostgreSQL\\18\\bin`) to your PATH.");
            return;
        }

        java.util.List<String> cmd = new java.util.ArrayList<>();
        cmd.add(pgDumpExe);
        cmd.add("-h"); cmd.add(host);
        cmd.add("-p"); cmd.add(port);
        cmd.add("-U"); cmd.add(user);
        cmd.add("-Fc");                                      // custom (compressed) format
        cmd.add("-f"); cmd.add(out.getAbsolutePath());
        if (tableQualifiedName != null) {
            cmd.add("-t"); cmd.add(tableQualifiedName);
        }
        cmd.add(db);

        Label running = appendSystem("Running pg_dump → " + out.getAbsolutePath()
                + " (this may take a while)…");
        sendButton.setDisable(true);

        background.submit(() -> {
            StringBuilder output = new StringBuilder();
            int exit = -1;
            String error = null;
            try {
                ProcessBuilder pb = new ProcessBuilder(cmd);
                pb.environment().put("PGPASSWORD", pass);
                pb.redirectErrorStream(true);
                Process p = pb.start();
                try (java.io.BufferedReader br = new java.io.BufferedReader(
                        new java.io.InputStreamReader(p.getInputStream()))) {
                    String line;
                    int n = 0;
                    while ((line = br.readLine()) != null) {
                        output.append(line).append("\n");
                        if (++n > 200) { output.append("…(truncated)\n"); break; }
                    }
                }
                exit = p.waitFor();
            } catch (java.io.IOException ioe) {
                error = "Could not launch pg_dump: " + ioe.getMessage();
            } catch (Exception e) {
                error = e.getMessage();
            }
            final boolean success = (error == null) && (exit == 0);
            final String summary = (error != null) ? error
                    : success
                        ? "✓ Backup complete → " + out.getAbsolutePath()
                            + " (" + (out.length() / 1024) + " KB)"
                        : "✗ pg_dump exited with code " + exit + ":\n" + output;
            Platform.runLater(() -> {
                messagesBox.getChildren().remove(running);
                appendSystem(summary);
                sendButton.setDisable(false);
            });
        });
    }

    /** Engine-specific "give me everything in this table" query. */
    private String buildDefaultTableQuery(String tableQualifiedName) {
        EngineFamily fam = currentEngine.family();
        return switch (fam) {
            case SQL -> "SELECT * FROM " + tableQualifiedName;
            case MONGO -> {
                // Sidebar shows entries like "<db>.<collection>"; Mongo runCommand
                // wants the bare collection name.
                int dot = tableQualifiedName.lastIndexOf('.');
                String coll = dot >= 0 ? tableQualifiedName.substring(dot + 1) : tableQualifiedName;
                yield coll + ".find()";
            }
            // Redis "tables" are type groups (string/hash/list/...) — there's no single
            // sensible default query. CouchDB lists databases, not collections.
            case REDIS, COUCHDB -> null;
        };
    }

    private void executeRawSql(String sql) {
        sendButton.setDisable(true);
        Label running = appendSystem("Running query…");
        background.submit(() -> {
            try {
                QueryResult r = currentEngine.executeQuery(sql);
                Platform.runLater(() -> {
                    messagesBox.getChildren().remove(running);
                    showResult(r);
                });
            } catch (Exception ex) {
                String error = ex.getMessage() == null ? ex.toString() : ex.getMessage();
                Platform.runLater(() -> {
                    messagesBox.getChildren().remove(running);
                    appendSystem("Execution failed: " + error);
                });
            } finally {
                Platform.runLater(() -> sendButton.setDisable(false));
            }
        });
    }

    /** Like {@link #appendUser} but renders the SQL in a monospace code area. */
    private void appendUserSql(String sql) {
        VBox card = new VBox(6);
        card.getStyleClass().addAll("bubble", "bubble-user");

        Label tag = new Label("Raw SQL");
        tag.getStyleClass().add("bubble-header");
        card.getChildren().add(tag);

        TextArea sqlArea = new TextArea(sql);
        sqlArea.setEditable(false);
        sqlArea.setWrapText(true);
        sqlArea.getStyleClass().add("sql-area");
        sqlArea.setPrefRowCount(Math.min(8, Math.max(2, sql.split("\n").length)));
        card.getChildren().add(sqlArea);

        HBox row = new HBox(card);
        row.setStyle("-fx-alignment: top-right;");
        row.getStyleClass().add("bubble-row-user");
        messagesBox.getChildren().add(row);
        scrollToBottom();
    }

    private void renderResponse(ChatResponse resp) {
        if (resp.hasError()) {
            appendSystem("Error: " + resp.errorMessage());
            return;
        }
        if (!resp.hasSql()) {
            appendAi(resp.rawLlmResponse() == null ? "(no response)" : resp.rawLlmResponse());
            return;
        }
        appendSqlCard(resp.sql(), resp.explanation(), resp.safety(), resp.userMessage(), 0);
    }

    private void appendSqlCard(String sql, String explanation, SqlSafetyAnalyzer.Analysis safety,
                               String originalUserMessage, int initialAttempt) {
        VBox card = new VBox(8);
        card.getStyleClass().addAll("bubble", "bubble-ai");

        Label header = new Label("Generated SQL");
        header.getStyleClass().add("bubble-header");
        card.getChildren().add(header);

        TextArea sqlArea = new TextArea(sql);
        sqlArea.setEditable(true);
        sqlArea.setWrapText(true);
        sqlArea.getStyleClass().add("sql-area");
        sqlArea.setPrefRowCount(Math.min(8, Math.max(3, sql.split("\n").length)));
        sqlArea.setTooltip(new Tooltip("Edit the SQL before running — Run uses the current text."));
        card.getChildren().add(sqlArea);

        if (explanation != null && !explanation.isBlank()) {
            Label exp = new Label(explanation);
            exp.setWrapText(true);
            exp.getStyleClass().add("bubble-explanation");
            card.getChildren().add(exp);
        }

        if (safety != null && !safety.warnings().isEmpty()) {
            for (String w : safety.warnings()) {
                Label warn = new Label("⚠ " + w);
                warn.setWrapText(true);
                warn.getStyleClass().addAll("safety-warning", levelClass(safety.level()));
                card.getChildren().add(warn);
            }
        }

        HBox actions = new HBox(8);
        Button copyBtn = new Button("Copy SQL");
        copyBtn.getStyleClass().add("ghost-button");
        copyBtn.setOnAction(e -> copyToClipboard(sqlArea.getText()));

        Button runBtn = new Button(safety != null && safety.requiresConfirmation() ? "Run (confirm)" : "Run");
        runBtn.getStyleClass().add("primary-button");
        runBtn.setOnAction(e -> {
            // Read whatever's currently in the editor — the user may have tweaked it.
            String currentSql = sqlArea.getText();
            // Re-analyze safety against the edited text, not the original.
            SqlSafetyAnalyzer.Analysis currentSafety = safetyAnalyzer.analyze(currentSql);
            if (currentSafety.requiresConfirmation()) {
                Alert alert = new Alert(Alert.AlertType.CONFIRMATION,
                        "This query is flagged as " + currentSafety.level() + ".\n\n"
                                + String.join("\n", currentSafety.warnings())
                                + "\n\nRun anyway?",
                        ButtonType.YES, ButtonType.CANCEL);
                alert.setHeaderText("Confirm potentially destructive query");
                alert.showAndWait().ifPresent(bt -> {
                    if (bt == ButtonType.YES) runSql(currentSql, runBtn, originalUserMessage, initialAttempt);
                });
            } else {
                runSql(currentSql, runBtn, originalUserMessage, initialAttempt);
            }
        });
        runBtn.setDisable(currentEngine == null || !currentEngine.isConnected());

        actions.getChildren().addAll(copyBtn, runBtn);
        card.getChildren().add(actions);

        messagesBox.getChildren().add(card);
        scrollToBottom();
    }

    private String levelClass(SqlSafetyAnalyzer.Level level) {
        return switch (level) {
            case SAFE -> "safety-safe";
            case RISKY -> "safety-risky";
            case DESTRUCTIVE -> "safety-destructive";
        };
    }

    // ---------- Execution -----------------------------------------------------

    private static final int MAX_AUTOFIX_ATTEMPTS = 2;

    private void runSql(String sql, Button trigger, String originalUserMessage, int attempt) {
        trigger.setDisable(true);
        Label running = appendSystem("Running query…");
        background.submit(() -> {
            try {
                QueryResult r = currentEngine != null
                        ? currentEngine.executeQuery(sql)
                        : chatService.execute(sql);
                Platform.runLater(() -> {
                    messagesBox.getChildren().remove(running);
                    showResult(r);
                });
            } catch (Exception ex) {
                String errorMessage = ex.getMessage() == null ? ex.toString() : ex.getMessage();
                Platform.runLater(() -> {
                    messagesBox.getChildren().remove(running);
                    appendSystem("Execution failed: " + errorMessage);

                    boolean canAutoFix = attempt < MAX_AUTOFIX_ATTEMPTS
                            && originalUserMessage != null
                            && !originalUserMessage.isBlank();
                    if (canAutoFix) {
                        autoFixAndShow(originalUserMessage, sql, errorMessage, attempt + 1);
                    } else if (attempt >= MAX_AUTOFIX_ATTEMPTS) {
                        appendSystem("Auto-fix attempt also failed. Try rephrasing the request or check the schema.");
                    }
                });
            } finally {
                Platform.runLater(() -> trigger.setDisable(false));
            }
        });
    }

    /**
     * Ask the LLM to correct a failed query, then surface the corrected SQL as
     * a new chat card. The user still has to click Run on the fixed query —
     * we don't auto-execute the correction.
     */
    private void autoFixAndShow(String originalUserMessage, String failedSql, String error, int nextAttempt) {
        Label thinking = appendSystem("Asking AI to fix the query…");
        String dbType = safe(dbTypeCombo.getValue(), connectionManager.getDbType());
        SchemaIntrospector.SchemaSnapshot schema =
                currentEngine != null && currentEngine.isConnected() ? currentEngine.introspectSchema() : null;
        background.submit(() -> {
            ChatResponse resp = chatService.fixSql(originalUserMessage, failedSql, error,
                    currentEngine, dbType, schema);
            Platform.runLater(() -> {
                messagesBox.getChildren().remove(thinking);
                if (resp.hasError()) {
                    appendSystem("Auto-fix failed: " + resp.errorMessage());
                } else if (!resp.hasSql()) {
                    appendAi(resp.rawLlmResponse() == null ? "(no response)" : resp.rawLlmResponse());
                } else {
                    // Tag the explanation so the user knows this is a correction.
                    String explanation = "Corrected version: "
                            + (resp.explanation() == null ? "" : resp.explanation());
                    appendSqlCard(resp.sql(), explanation, resp.safety(), originalUserMessage, nextAttempt);
                }
            });
        });
    }

    private void showResult(QueryResult r) {
        setResultPaneVisible(true);
        lastResult = r;

        if (r.kind() == QueryResult.Kind.UPDATE_COUNT) {
            resultTable.getColumns().clear();
            resultTable.getItems().clear();
            resultViewport.getChildren().setAll(resultTable);
            viewTable.setSelected(true);
            resultMetaLabel.setText(r.updateCount() + " row(s) affected · " + r.elapsedMillis() + " ms");
            appendSystem(r.updateCount() + " row(s) affected in " + r.elapsedMillis() + " ms.");
            return;
        }

        // Populate the underlying TableView regardless — chart views are derived from the
        // same data and we want Table to be ready when the user toggles back.
        resultTable.getColumns().clear();
        for (int i = 0; i < r.columns().size(); i++) {
            final int col = i;
            TableColumn<List<Object>, String> tc = new TableColumn<>(r.columns().get(i));
            tc.setCellValueFactory(cd -> {
                Object v = col < cd.getValue().size() ? cd.getValue().get(col) : null;
                return new SimpleObjectProperty<>(v == null ? "" : v.toString()).asString();
            });
            tc.setPrefWidth(140);
            resultTable.getColumns().add(tc);
        }
        resultTable.setItems(FXCollections.observableArrayList(r.rows()));
        resultMetaLabel.setText(r.rows().size() + " row(s) · " + r.elapsedMillis() + " ms"
                + (r.truncated() ? " · truncated" : ""));
        appendSystem("Returned " + r.rows().size() + " row(s) in " + r.elapsedMillis() + " ms"
                + (r.truncated() ? " (truncated)" : "") + ".");

        // Render whatever view is currently selected (Table by default).
        applyResultViewMode();
    }

    // ---------- Chart / view-mode switching ----------

    private void applyResultViewMode() {
        if (lastResult == null) return;
        if (lastResult.kind() != QueryResult.Kind.RESULT_SET) {
            resultViewport.getChildren().setAll(resultTable);
            return;
        }
        if (viewTable.isSelected()) {
            resultViewport.getChildren().setAll(resultTable);
            return;
        }

        // Find the column we'll use for numeric values. Bail to Table if there isn't one.
        int valueCol = findFirstNumericColumn(lastResult);
        if (valueCol < 0 || lastResult.columns().size() < 2) {
            viewTable.setSelected(true);
            appendSystem("Need at least one numeric column to draw a chart — staying on Table view.");
            return;
        }
        int labelCol = (valueCol == 0) ? 1 : 0;

        javafx.scene.Node chart;
        if (viewBar.isSelected())       chart = buildBarChart(lastResult, labelCol, valueCol);
        else if (viewPie.isSelected())  chart = buildPieChart(lastResult, labelCol, valueCol);
        else if (viewLine.isSelected()) chart = buildLineChart(lastResult, labelCol, valueCol);
        else                            chart = resultTable;

        resultViewport.getChildren().setAll(chart);
    }

    private BarChart<String, Number> buildBarChart(QueryResult r, int labelCol, int valueCol) {
        CategoryAxis x = new CategoryAxis();
        NumberAxis y = new NumberAxis();
        x.setLabel(r.columns().get(labelCol));
        y.setLabel(r.columns().get(valueCol));
        BarChart<String, Number> chart = new BarChart<>(x, y);
        chart.setLegendVisible(false);
        chart.setAnimated(false);

        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName(r.columns().get(valueCol));
        for (List<Object> row : r.rows()) {
            Number v = toNumber(row.get(valueCol));
            if (v == null) continue;
            series.getData().add(new XYChart.Data<>(String.valueOf(row.get(labelCol)), v));
        }
        chart.getData().add(series);
        return chart;
    }

    private LineChart<String, Number> buildLineChart(QueryResult r, int labelCol, int valueCol) {
        CategoryAxis x = new CategoryAxis();
        NumberAxis y = new NumberAxis();
        x.setLabel(r.columns().get(labelCol));
        y.setLabel(r.columns().get(valueCol));
        LineChart<String, Number> chart = new LineChart<>(x, y);
        chart.setAnimated(false);
        chart.setCreateSymbols(true);

        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName(r.columns().get(valueCol));
        for (List<Object> row : r.rows()) {
            Number v = toNumber(row.get(valueCol));
            if (v == null) continue;
            series.getData().add(new XYChart.Data<>(String.valueOf(row.get(labelCol)), v));
        }
        chart.getData().add(series);
        return chart;
    }

    private PieChart buildPieChart(QueryResult r, int labelCol, int valueCol) {
        javafx.collections.ObservableList<PieChart.Data> data = FXCollections.observableArrayList();
        for (List<Object> row : r.rows()) {
            Number v = toNumber(row.get(valueCol));
            if (v == null) continue;
            data.add(new PieChart.Data(String.valueOf(row.get(labelCol)), v.doubleValue()));
        }
        PieChart chart = new PieChart(data);
        chart.setAnimated(false);
        chart.setLabelsVisible(true);
        return chart;
    }

    /** Find the first column whose non-null values all parse as numbers. */
    private int findFirstNumericColumn(QueryResult r) {
        for (int i = 0; i < r.columns().size(); i++) {
            boolean allNumeric = true;
            boolean anyValue = false;
            for (List<Object> row : r.rows()) {
                Object cell = i < row.size() ? row.get(i) : null;
                if (cell == null) continue;
                anyValue = true;
                if (toNumber(cell) == null) { allNumeric = false; break; }
            }
            if (allNumeric && anyValue) return i;
        }
        return -1;
    }

    private Number toNumber(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n;
        try { return Double.parseDouble(o.toString().trim()); }
        catch (Exception e) { return null; }
    }

    // ---------- Chat bubble helpers -------------------------------------------

    private void appendUser(String text) {
        Label l = new Label(text);
        l.setWrapText(true);
        l.getStyleClass().addAll("bubble", "bubble-user");
        l.setMaxWidth(Region.USE_PREF_SIZE);

        Button copyBtn = new Button("📋 Copy");
        copyBtn.getStyleClass().addAll("ghost-button", "bubble-action");
        copyBtn.setOnAction(e -> copyToClipboard(text));

        Button editBtn = new Button("✏ Edit");
        editBtn.getStyleClass().addAll("ghost-button", "bubble-action");
        editBtn.setTooltip(new Tooltip("Load this message back into the input box for editing"));
        editBtn.setOnAction(e -> {
            inputArea.setText(text);
            inputArea.requestFocus();
            inputArea.positionCaret(text.length());
        });

        HBox actions = new HBox(4, copyBtn, editBtn);
        actions.setStyle("-fx-alignment: top-right;");

        VBox stack = new VBox(3, l, actions);
        stack.setStyle("-fx-alignment: top-right;");

        HBox row = new HBox(stack);
        row.setStyle("-fx-alignment: top-right;");
        row.getStyleClass().add("bubble-row-user");
        messagesBox.getChildren().add(row);
        scrollToBottom();
    }

    private void copyToClipboard(String text) {
        if (text == null) return;
        javafx.scene.input.Clipboard cb = javafx.scene.input.Clipboard.getSystemClipboard();
        javafx.scene.input.ClipboardContent cc = new javafx.scene.input.ClipboardContent();
        cc.putString(text);
        cb.setContent(cc);
    }

    private void appendAi(String text) {
        Label l = new Label(text);
        l.setWrapText(true);
        l.getStyleClass().addAll("bubble", "bubble-ai");
        messagesBox.getChildren().add(l);
        scrollToBottom();
    }

    private Label appendSystem(String text) {
        Label l = new Label(text);
        l.setWrapText(true);
        l.getStyleClass().addAll("bubble", "bubble-system");
        messagesBox.getChildren().add(l);
        scrollToBottom();
        return l;
    }

    private void scrollToBottom() {
        Platform.runLater(() -> {
            chatScroll.layout();
            chatScroll.setVvalue(1.0);
        });
    }

    private static String safe(String s, String fallback) {
        return (s == null || s.isBlank()) ? fallback : s.trim();
    }

    /** Adjust field defaults + enabled states per DB type. */
    private void applyTypeUiAffordances(String dbType) {
        if (currentEngine == null) return;
        String port = currentEngine.defaultPort(dbType);
        if (port != null && !port.isEmpty()) portField.setText(port);

        boolean fileBased = currentEngine.isFileBased(dbType);
        hostField.setDisable(fileBased);
        portField.setDisable(fileBased);
        usernameField.setDisable(false);
        passwordField.setDisable(false);
        loadDatabasesButton.setDisable(fileBased);
    }

    /** Map the lowercase keys used in application.yml to the combo's display labels. */
    private static String normalizeDbType(String type) {
        if (type == null) return "PostgreSQL";
        return switch (type.toLowerCase().trim()) {
            case "postgresql", "postgres" -> "PostgreSQL";
            case "mysql", "mariadb" -> "MySQL";
            case "sql server", "sqlserver", "mssql" -> "SQL Server";
            case "oracle" -> "Oracle";
            case "sqlite" -> "SQLite";
            case "mongo", "mongodb" -> "MongoDB";
            case "redis" -> "Redis";
            case "couch", "couchdb" -> "CouchDB";
            default -> "PostgreSQL";
        };
    }
}
