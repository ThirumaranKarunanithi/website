# Magizhchi DB Communicator

AI-powered desktop database assistant. Type natural language; get SQL; run it against your database.

This repo is the **MVP slice** — JavaFX UI + Spring Boot core + Ollama integration + PostgreSQL JDBC, all in one Maven module. Other databases (MySQL, SQL Server, Oracle, SQLite, Mongo) and the connection-profile manager are next on the roadmap.

## Stack

- Java 17
- JavaFX 17 + FXML
- Spring Boot 3.4 (used as the in-process service container — no web server)
- Ollama (local LLM, default model `llama3`)
- PostgreSQL JDBC + HikariCP
- Maven

## Prerequisites

1. JDK 17
2. Maven 3.9+
3. [Ollama](https://ollama.com/) running locally:
   ```bash
   ollama serve
   ollama pull llama3        # or deepseek-coder / codellama / mistral
   ```
4. A reachable PostgreSQL instance (for the MVP database connector).

## Run

```bash
mvn javafx:run
```

The window opens. In the top bar:
- Enter your JDBC URL, e.g. `jdbc:postgresql://localhost:5432/postgres`
- Enter username + password
- Click **Connect**

Then in the chat input, ask anything:
- `Show me all tables`
- `List the 10 most recently created users`
- `Find duplicate emails in the customers table`
- `Generate 20 sample employee rows`

The AI generates SQL, shows safety warnings if the query is risky/destructive, and only executes when you click **Run** (with a confirmation dialog for destructive operations).

## Configuration

Edit `src/main/resources/application.yml`:

```yaml
magizhchi:
  ollama:
    base-url: http://localhost:11434
    model: llama3            # any pulled Ollama model
    timeout-seconds: 120
  query:
    max-rows: 500            # cap rows returned to the UI
    timeout-seconds: 30      # JDBC query timeout
```

## Architecture

```
ui/MainController         ──▶  service/ChatService  ──▶  ai/OllamaClient
                                                   ──▶  ai/PromptBuilder
                                                   ──▶  ai/SqlExtractor
                                                   ──▶  ai/SqlSafetyAnalyzer
                                                   ──▶  db/QueryExecutor
db/ConnectionManager  (owns the active HikariDataSource)
db/SchemaIntrospector (caches table/column metadata for prompts)
```

The flow: chat input → `ChatService.generate()` builds a schema-aware prompt → Ollama returns text → `SqlExtractor` pulls the fenced SQL block → `SqlSafetyAnalyzer` classifies it (SAFE / RISKY / DESTRUCTIVE) → UI shows it with **Copy** and **Run** buttons → on Run, `QueryExecutor` runs it against the live connection and the result renders in the table below.

## Safety

- Destructive patterns (`DROP`, `TRUNCATE`, `DELETE`/`UPDATE` without `WHERE`, schema-modifying `ALTER`) require an explicit confirmation dialog before execution.
- JDBC query timeout is enforced (default 30s).
- Result row count is capped (default 500) to keep the UI responsive.
- Credentials are held only in the running JVM — nothing is persisted yet. The encrypted credential store + connection profile manager from the full spec is the next slice.

## Native installers (Windows / macOS)

The `installer` Maven profile wraps the app + a bundled JRE into a native installer using `jpackage` (built into JDK 14+). Run it **on the OS you want to target** — jpackage cannot cross-compile.

### Common build command

```bash
mvn -P installer clean package
```

Output: `target/installer/<installer-file>`.

The installer auto-detects the platform you run on:

| Host OS  | Default output | Switch to alt format |
|----------|----------------|----------------------|
| Windows  | `.exe` (NSIS-based, no extra tools) | Add `<type>MSI</type>` to the plugin config and install [WiX Toolset](https://wixtoolset.org/) 3.x on PATH |
| macOS    | `.dmg` (drag-to-Applications) | Add `<type>PKG</type>` for a multi-step installer |
| Linux    | `.deb` on Debian/Ubuntu, `.rpm` on RHEL/Fedora | — |

### Windows specifics

- Plain `.exe` works out of the box; install just gives a "user-only" install in `%LOCALAPPDATA%\Magizhchi DB Communicator`. The profile sets:
  - `winMenu` → Start Menu entry under group "Magizhchi"
  - `winShortcut` → Desktop shortcut
  - `winDirChooser` → user can pick the install directory
  - `winPerUserInstall` → no admin rights needed
- For an `.msi` (better for enterprise deploys): set `<type>MSI</type>` and install [WiX 3.x](https://github.com/wixtoolset/wix3/releases) so `light.exe` / `candle.exe` are on PATH. WiX 4 is **not** compatible with jpackage as of JDK 21.

### macOS specifics

- A `.dmg` mounts a disk image with the app bundle; user drags to `/Applications`.
- For Gatekeeper compatibility you'll need to **codesign and notarize**. That requires an Apple Developer ID and is out of scope for this slice — unsigned builds work fine for local/test use but show a "developer cannot be verified" warning. Add `--mac-sign --mac-signing-key-user-name "Your Name"` to the plugin's `<additionalOptions>` when you have credentials.

### App branding (logo + installer icon)

The app shipping shape requires two files. The directories already exist; just drop the files in.

| Where it shows | File to add | Path |
|---|---|---|
| In-app top-bar logo | `logo.png` (any size; auto-scaled to 38px height) | `src/main/resources/images/logo.png` |
| Installed `.exe` icon + installer wizard icon (Windows) | `icon.ico` (multi-resolution: 16, 32, 48, 64, 128, 256 px) | `src/main/installer/icon.ico` |
| App bundle icon (macOS) | `icon.icns` | `src/main/installer/icon.icns` |

**Converting PNG → ICO** (Windows installer requirement):

```bash
# With ImageMagick (https://imagemagick.org/)
magick convert logo.png -define icon:auto-resize=256,128,64,48,32,16 src/main/installer/icon.ico

# Or use a free online converter and pick "multi-resolution":
#   https://www.icoconverter.com/  → upload PNG → check 16/32/48/64/128/256 → download .ico
```

After adding the icon file, uncomment the `<icon>` line in `pom.xml`'s `installer` profile and the matching line in the `exe` profile (or add it if not present):

```xml
<icon>${project.basedir}/src/main/installer/icon.ico</icon>
```

Then rebuild: `mvn -P installer clean package` (or `-P exe`).

### Versioning

`jpackage` rejects `-SNAPSHOT`. The installer profile reads `<app.version>` from `pom.xml` (currently `0.1.0`), independent of the project version. Bump it when cutting a release.

### Troubleshooting

- **`Error: Cannot find jpackage`** → you're on JDK < 14. Switch to JDK 17+ (already required for this project).
- **`No suitable jpackage tool found`** with JDK 17+ → make sure `JAVA_HOME` points to the JDK (not a JRE) and `JAVA_HOME\bin` is on PATH.
- **`WixWixobjBuildException`** on Windows MSI → WiX missing or wrong version. Install WiX 3.x and re-run.
- **Installer is ~200 MB** → that's expected; it bundles a stripped JRE + the Spring Boot fat jar (~30 MB) + JavaFX natives. Use jlink module trimming if size matters.
- **App crashes on first launch with "Could not find or load main class"** → the staged jar in `target/installer-input/` wasn't created. Make sure `clean` is in the command (`mvn -P installer clean package`) so the staging step runs.
- **`Can not find WiX tools (light.exe, candle.exe)` on Windows** → JDK 17's `jpackage` on Windows uses WiX to wrap the app into an `.exe` / `.msi` installer. Install [WiX Toolset 3.x](https://github.com/wixtoolset/wix3/releases) (download the `wix311-binaries.zip`, extract to e.g. `C:\WiX\bin`, add `C:\WiX\bin` to PATH, restart your shell). WiX 4 is **not** compatible with jpackage. Then re-run `mvn -P installer clean package`. If you don't want to install WiX, use the `exe` profile instead — it produces a portable app folder (no installer wizard, but recipients just unzip and run).

## Roadmap (next slices)

- [ ] Connection profile manager with AES-encrypted credential store
- [ ] MySQL, SQL Server, Oracle, SQLite drivers + `inferDbType` switch
- [ ] Query history and saved queries (SQLite local store)
- [ ] Right-panel "AI reasoning" + "Schema insights" + "Optimization tips"
- [ ] Streaming Ollama responses (live token-by-token rendering)
- [ ] Database explorer right-click actions (open table data, generate CRUD, export)
- [ ] Sample data generator dedicated flow
- [ ] Docker compose for Ollama + sample Postgres
- [x] jpackage installers for Windows / macOS / Linux (`mvn -P installer package`)
- [ ] Official Magizhchi Software branding (logo, palette, gradients) — currently using placeholder colors

## License

TBD.
