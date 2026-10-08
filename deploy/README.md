# Deploying icecode.dev

Push to `main`. That's it.

```
git push ──► GitHub Actions (.github/workflows/release.yml)
             npm ci → next build (output: standalone) → site.tar.gz + manifest.json
             └─► GitHub Release  site-<run>-<sha>   (marked "latest"; newest 5 kept)

icecode.dev host (Pterodactyl server "IceCode Website")
  node launcher.js  ── polls releases/latest/download/manifest.json every 2 min
     ├─ new tag? download → sha256 check → unpack into releases/<tag>/
     ├─ start it on 127.0.0.1:3101/3102 beside the running copy
     ├─ answers GET / ? → proxy flips to it, old copy drains 10 s and stops
     └─ doesn't?       → never shown to visitors; the old copy keeps serving
```

The host never builds, so a broken build can't take the site down — it just never
becomes a release.

## Checking what's live

- `curl -sI https://icecode.dev | grep x-icecode-release` — every response carries the tag.
- `https://icecode.dev/__release` — serving / previous / paused / last check, as JSON.
- Host log: `logs/deploy.log` in the server's files.

## Console commands (Pterodactyl console)

| Command    | Does |
|------------|------|
| `status`   | what's serving, what was before, paused or not |
| `update`   | check GitHub right now (also retries a release that failed its health check) |
| `rollback` | go back to the previous release and **pause** auto-updates |
| `resume`   | turn auto-updates back on and check now |

## Host layout (`/home/container`)

```
launcher.js            this folder's launcher.js (copied by hand; it is not self-updating)
deploy-state.json      active / previous release, paused flag
releases/<tag>/        unpacked releases (newest 3 + active + previous kept)
public/SkinViewer/     heavy 3D assets for /projects/skinCreator  ┐ gitignored, so not in
public/PortMusic/      music                                      ┘ releases: hard-linked in
logs/deploy.log
```

The server's startup command is `node /home/container/launcher.js` (set per server
in the panel; the egg's own startup would `npm install` on every boot).

## Changing the launcher

`launcher.js` is the one file that doesn't auto-deploy. After editing it here, upload
it over `/home/container/launcher.js` and restart the server from the panel.
