# iLockIt

iLockIt is a Firefox extension that locks specific websites behind a password. Choose a suspension duration to temporarily allow access without re-entering the password.

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

## AMO Listing
https://addons.mozilla.org/en-US/firefox/addon/ilockit/

## Usage
1. Open the options page and add domains to lock.
2. Set a password.
3. Visit a locked site and enter the password to unlock.

## For Accessing Options
1. Go to extensions page.
2. Click on the vertical three dots icon beside the title of iLockIt extension.
3. Click on 'options'.
4. Tadaaa!

## Permissions
- `webRequest` and `webRequestBlocking` to redirect locked sites to the lock screen.
- `storage` to save locked sites, password hash, and cooldowns.
- `tabs` for optional navigation flows.
- `<all_urls>` to match any site you choose to lock.

## Privacy
iLockIt does not collect or transmit personal data. All settings remain in local browser storage.

## License
MIT. See `LICENSE`.
