import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'DMCA Policy' };

export default function DmcaPage() {
  return (
    <LegalPage title="DMCA Policy" lastUpdated="June 27, 2025">
      <section>
        <h2>Designated agent</h2>
        <p>
          CodeCard respects intellectual property rights. Our designated DMCA agent can be reached
          at:
        </p>
        <p className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          DMCA Agent
          <br />
          CodeCard, Inc.
          <br />
          [Physical address placeholder. Update before launch]
          <br />
          dmca@codecard.app
        </p>
      </section>
      <section>
        <h2>Notice requirements</h2>
        <p>A valid DMCA notice must include:</p>
        <ul>
          <li>Identification of the copyrighted work</li>
          <li>Identification of the infringing material and its location on CodeCard</li>
          <li>Your contact information</li>
          <li>A statement of good faith belief that use is unauthorized</li>
          <li>A statement under penalty of perjury that the information is accurate</li>
          <li>Your physical or electronic signature</li>
        </ul>
      </section>
      <section>
        <h2>Takedown process</h2>
        <p>
          Upon receiving a valid notice, we will review and remove or disable access to the
          identified material expeditiously. We will notify the user who posted the content.
        </p>
      </section>
      <section>
        <h2>Counter-notice</h2>
        <p>
          If you believe content was removed in error, you may submit a counter-notice to our DMCA
          agent with the information required under 17 U.S.C. § 512(g).
        </p>
      </section>
      <section>
        <h2>Repeat infringers</h2>
        <p>
          We maintain a policy to terminate accounts of users who are repeat copyright infringers
          in appropriate circumstances.
        </p>
      </section>
    </LegalPage>
  );
}
