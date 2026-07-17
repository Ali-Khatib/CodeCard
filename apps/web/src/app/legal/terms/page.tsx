import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="July 17, 2026">
      <section>
        <h2>Agreement</h2>
        <p>
          By using CodeCard, you agree to these terms. If you do not agree, do not use the
          service.
        </p>
      </section>
      <section>
        <h2>Your account</h2>
        <p>
          You are responsible for your account credentials and all activity under your account.
          You must provide accurate information and keep it updated.
        </p>
      </section>
      <section>
        <h2>Your content</h2>
        <p>
          You retain ownership of content you upload. You grant CodeCard a license to host, display,
          and distribute your public profile content as necessary to operate the service.
        </p>
      </section>
      <section>
        <h2>Account data export and deletion</h2>
        <p>
          You may download an in-app export of your approved account data while signed in. The
          export is provided as structured JSON through Settings and reflects the data categories
          CodeCard supports for export.
        </p>
        <p>
          You may request deletion of your own account through the in-app account controls in
          Settings. Deletion requires identity confirmation, including exact confirmation text and
          recent reauthentication, plus other safety checks. If you have an active or cancellable
          subscription, CodeCard cancels it as part of a successful deletion request (or confirms
          that no cancellable subscription exists). You are responsible for saving any copies of
          content you need before deletion. After a successful deletion, access to the account is
          permanently removed. Limited legal, billing, security, or compliance records may be
          retained or anonymized as described in the Privacy Policy.
        </p>
        <p>
          Deletion may be temporarily unavailable when required safety checks or configuration are
          missing. In that case your account is not deleted.
        </p>
      </section>
      <section>
        <h2>Subscriptions</h2>
        <p>
          Paid plans are billed monthly through Stripe. Pricing and features are shown at checkout.
          You may cancel a subscription anytime through the customer portal. Access continues
          through the end of the paid period unless account deletion cancels the subscription as
          described above.
        </p>
      </section>
      <section>
        <h2>Termination</h2>
        <p>
          We may suspend or terminate accounts that violate our Acceptable Use Policy. You may
          request deletion of your account at any time through the in-app account controls, subject
          to the confirmation and safety checks described above.
        </p>
      </section>
      <section>
        <h2>Disclaimer</h2>
        <p>
          CodeCard is provided &quot;as is&quot; without warranties. We are not liable for
          indirect or consequential damages to the extent permitted by law.
        </p>
      </section>
      <section>
        <h2>About these terms</h2>
        <p>
          These terms describe current product behavior for CodeCard. Technical/product copy
          alignment completed — attorney review pending.
        </p>
      </section>
    </LegalPage>
  );
}
