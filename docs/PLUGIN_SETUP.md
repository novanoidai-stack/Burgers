# 🔌 Plugin Setup Guide - rtk-ai/homebrew-tap

## Antes de Instalar

**Necesitas verificar qué tipo de repositorio es** visitando:
https://github.com/rtk-ai/homebrew-tap

Busca:
- Carpeta `plugins/` con archivos `.claude-plugin/plugin.json` → **Opción A**
- Archivos `.rb` (Ruby formulas) → **Opción B**

---

## Opción A: Si es un Claude Code Plugin

Si el repositorio contiene un directorio `plugins/`:

```bash
# Dentro de Claude Code (como comando):
/plugin add-marketplace https://github.com/rtk-ai/homebrew-tap.git
```

Luego lista plugins disponibles:
```bash
/plugin list
```

E instala el específico:
```bash
/plugin install <nombre-plugin>
```

---

## Opción B: Si es un Homebrew Formula (macOS/Linux)

**NOTA**: Homebrew no funciona nativamente en Windows 11. Necesitas WSL2.

### Paso 1: Habilitar WSL2 en Windows 11

```powershell
# En PowerShell como Administrador:
wsl --install -d Ubuntu
```

Reinicia tu máquina.

### Paso 2: Abre Ubuntu (WSL2)

```bash
# Abre una terminal y escribe:
wsl
```

### Paso 3: Instala Homebrew dentro de WSL2

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Sigue los prompts. Al final, ejecuta:

```bash
(echo; echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"') >> ~/.bashrc
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
```

### Paso 4: Instala desde rtk-ai tap

```bash
brew tap rtk-ai/homebrew-tap
brew install <nombre-del-herramienta>
```

---

## Paso 3: Integra con Claude Code (Si fue necesario WSL2)

Una vez instalado el tool en WSL2, necesitas exponerlo a Claude Code (Windows):

### Opción B1: Via PATH en Git Bash

Si usas Git Bash desde Windows:

```bash
# En ~/.bashrc (dentro de WSL2):
export PATH="/home/linuxbrew/.linuxbrew/bin:$PATH"

# Obtén el path exacto:
which <nombre-herramienta>
# Ej: /home/linuxbrew/.linuxbrew/bin/rtk-ai-cli
```

Desde Git Bash en Windows, accede así:

```bash
wsl /home/linuxbrew/.linuxbrew/bin/<nombre-herramienta>
```

### Opción B2: Alias en `.claudecode/settings.json` (Recomendado)

Edita `~/.claude/settings.json` y añade:

```json
{
  "environment_variables": {
    "RTK_AI_PATH": "/home/linuxbrew/.linuxbrew/bin/rtk-ai-cli"
  }
}
```

Luego desde Claude:

```bash
wsl ${RTK_AI_PATH} [arguments]
```

---

## Verificación

Una vez instalado, verifica que funciona:

### Si fue Opción A:
```bash
/plugin list
# Deberías ver "rtk-ai" o similar en la lista
```

### Si fue Opción B:
```bash
wsl <nombre-herramienta> --version
# O si lo instalaste en PATH:
<nombre-herramienta> --help
```

---

## Troubleshooting

**"Plugin not found"** → El repositorio no tiene estructura de Claude Code plugin
- Solución: Verifica que tiene carpeta `plugins/` con archivos `.claude-plugin`

**"Homebrew command not found"** (en WSL2) → WSL2 no tiene Homebrew instalado
- Solución: Ejecuta el script de instalación de Homebrew en el paso 3 anterior

**WSL2 no se inicia** → Virtualization está deshabilitado en BIOS
- Solución: Reinicia, entra a BIOS (Del/F2/F12 según fabricante), habilita "Virtualization" o "Intel VT"

---

## Documentación

Una vez instalado, consulta:
- Sitio oficial: https://github.com/rtk-ai/homebrew-tap
- README del repositorio para comandos disponibles
- `<nombre-herramienta> --help` para ayuda en línea
