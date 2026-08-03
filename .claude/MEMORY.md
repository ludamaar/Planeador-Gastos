# Memoria persistente — claude-mem

Este proyecto tiene habilitada la skill/plugin de memoria **claude-mem**
([thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)), que
conserva el contexto entre sesiones de Claude Code: comprime lo que ocurre en
cada sesión y reinyecta lo relevante al iniciar la siguiente.

## Cómo está configurado

El plugin se declara a nivel de proyecto en [`.claude/settings.json`](./settings.json):

```json
{
  "extraKnownMarketplaces": {
    "thedotmack": {
      "source": { "source": "github", "repo": "thedotmack/claude-mem" }
    }
  },
  "enabledPlugins": {
    "claude-mem@thedotmack": true
  }
}
```

Con esto, cualquiera que abra este repositorio en Claude Code tiene el
marketplace disponible y el plugin marcado como habilitado.

## Puesta en marcha (una sola vez por máquina)

El plugin incluye hooks de captura de sesión y un servicio *worker* en segundo
plano. Para que la memoria empiece a capturar y a inyectar contexto de verdad,
ejecuta una vez en tu equipo:

```bash
npx claude-mem install
```

Luego **reinicia Claude Code**. A partir de ahí, el contexto de sesiones
anteriores aparece automáticamente en las nuevas.

Alternativa desde dentro de Claude Code (usa la config de este repo):

```
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
```

## Skills útiles que aporta

- `mem-search` — busca en la memoria persistente entre sesiones
  ("¿ya resolvimos esto?", "¿cómo hicimos X la vez pasada?").
- `knowledge-agent` — recupera trabajo de sesiones previas.
- `how-it-works` — explica qué captura claude-mem y dónde vive el dato.

Los datos de memoria se guardan localmente en `~/.claude-mem/` en tu máquina;
no se versionan en este repositorio.
