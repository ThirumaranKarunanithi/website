; Inno Setup script for Magizhchi DB Communicator.
; Targets Inno Setup 5.5.x (avoids IS6-only directives).
;
; Wraps the jpackage app-image (target\exe\Magizhchi DB Communicator\)
; into a real Windows installer (Setup.exe) with Start Menu / Desktop
; shortcuts, an uninstaller, and an Add/Remove Programs entry.
;
; Built automatically by:  mvn -P winsetup clean package
; Or manually:             ISCC src\main\installer\setup.iss

#define MyAppName         "Magizhchi DB Communicator"
#define MyAppVersion      "0.1.0"
#define MyAppPublisher    "Magizhchi Software"
#define MyAppURL          "https://magizhchi.software/"
#define MyAppExeName      "Magizhchi DB Communicator.exe"
#define SourceFolder      "..\..\..\target\exe\Magizhchi DB Communicator"
#define OutputFolder      "..\..\..\target\installer-output"

[Setup]
AppId={{8F2D4E1A-1234-4F5C-9A3B-MAGIZHCHIDBC01}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={localappdata}\Programs\{#MyAppName}
DefaultGroupName=Magizhchi
DisableProgramGroupPage=yes
OutputDir={#OutputFolder}
OutputBaseFilename=MagizhchiDBCommunicator-Setup-{#MyAppVersion}
SetupIconFile=icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma
SolidCompression=yes
PrivilegesRequired=lowest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: unchecked

[Files]
; Recursively copy everything from the jpackage app-image into the install dir.
Source: "{#SourceFolder}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\Magizhchi DB Communicator.ico"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{userdesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\Magizhchi DB Communicator.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "&Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent
