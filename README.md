# iLockIt
<div align="center">
  <img src="https://socialify.git.ci/iamneek/iLockIt/image?font=Bitter&language=1&name=1&pattern=Signal&stargazers=1&theme=Light" alt="iLockIt" width="640" height="320" />
</div>
iLockIt is a Firefox (currently supports firefox only) extension that locks specific websites behind a password. Choose a suspension duration to temporarily allow access without re-entering the password.

## Features
- Lock any domain or wildcard subdomains (for example, `example.com` or `*.news.com`)
- Password-protected access to locked sites
- Suspension timer options: immediately, 2, 5, 10, 30 minutes, or custom
- Options page to manage locked sites and password
- Optional masking of toolbar icon and title

## How it works
iLockIt intercepts navigation to locked sites and redirects to a lock screen. After entering the password, you can choose how long to suspend the password requirement for that site.

## Install (temporary in Firefox)
1. Open `about:debugging`.
2. Select "This Firefox".
3. Click "Load Temporary Add-on".
4. Choose `manifest.json` from this folder.

## Find iLockIt in Mozilla Addons
https://addons.mozilla.org/en-US/firefox/addon/ilockit/

## Usage
1. Open the options page and add domains to lock.
2. Set a password.
3. Visit a locked site and enter the password to unlock.

## For Accessing Options
1. Go to extensions page.
<img width="1366" height="681" alt="image" src="https://github.com/user-attachments/assets/c0b7fff6-5d86-48a0-b174-cf3357edecef" />

2. Click on the three dots '...' icon beside the title of iLockIt extension.
<img width="701" height="113" alt="image" src="https://github.com/user-attachments/assets/03b20ca1-857c-4c6f-a290-3c5cbf8eb8f4" />

3. Click on 'options'.
<img width="812" height="224" alt="image" src="https://github.com/user-attachments/assets/3a5983b9-507b-44fc-8997-26e8640be661" />

4. Tadaaa!
<img width="1350" height="768" alt="image" src="https://github.com/user-attachments/assets/5257222f-3281-4d83-af55-215aa7cf7025" />

## Permissions
- `webRequest` and `webRequestBlocking` to redirect locked sites to the lock screen.
- `storage` to save locked sites, password hash, and cooldowns.
- `tabs` for optional navigation flows.
- `<all_urls>` to match any site you choose to lock.

## Privacy
iLockIt does not collect or transmit personal data. All settings remain in local browser storage.

## License
MIT. See `LICENSE`.
