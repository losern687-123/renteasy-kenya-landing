# Fix messaging layout, property editing, and registration friction

## 1. Landlord Messages panel fills its column

The chat pane in the landlord dashboard's Messages tab sits inside a flex row, but the chat window collapses instead of filling the space next to the conversation list.

- Make the chat column stretch fully: the flex child gets `flex-1 min-w-0` and the chat window fills 100% width/height of it.
- Give the panel a taller, viewport-based height so the message thread and composer sit at the bottom of the card instead of floating mid-card.
- Keep the mobile behaviour unchanged (list first, thread after selection).

## 2. Landlords can edit a listed property

Right now a property card only allows copying the code, toggling vacant/occupied, and listing it — nothing can be corrected after creation.

- Add an **Edit** action to each card in "My Properties".
- Opens a dialog with the editable fields: name, location, property type, bedrooms, bathrooms, max tenants, rent amount, deposit, description.
- Saving updates the property record and refreshes the list. Property code stays fixed (tenants rely on it).
- Editing works whether or not the property is already listed on the marketplace; the linked marketplace listing keeps pointing at the same property, so corrected details show up there too.

## 3. Registration: remove email confirmation

The "Email not confirmed" login error happens because new signups must click a confirmation email first.

- Turn on auto-confirm for email signups, so a new account can sign in immediately after registering.
- Accounts created **before** this change stay unconfirmed and will still need one more signup attempt with a fresh email (or a password reset) — I'll call that out after the change.

## 4. Relax password rules

- Turn off the leaked-password (data breach) check so passwords are no longer rejected for appearing in breach lists.
- Remove the "Not found in known data breaches" checklist item, the red breach warning box, and the "Compromised" strength state from the signup UI.
- Keep the practical rules: 8+ characters, upper, lower, number, special character, plus the live strength meter and tips.

## Technical notes

- `src/pages/LandlordDashboard.tsx` (messages case) + `src/components/chat/ChatWindow.tsx` sizing classes.
- New `src/components/landlord/EditPropertyDialog.tsx`, wired into `src/components/landlord/PropertiesTable.tsx` via an update against the existing `properties` columns (no schema change, existing RLS already scopes updates to the owning landlord).
- Auth settings changed via the backend auth config tool: `auto_confirm_email: true`, `password_hibp_enabled: false`.
- `PasswordRequirements.tsx` / `PasswordStrengthIndicator.tsx` drop the `breached` props; `Auth.tsx` drops the `breachedPassword` state and its toast branch.  
Ensure no security issues arise after these changes and no breaking of any workflows on the platform currenlty