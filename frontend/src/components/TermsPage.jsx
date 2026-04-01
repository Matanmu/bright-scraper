import './TermsPage.scss';

export default function TermsPage() {
  return (
    <div className="terms-page">
      <div className="terms-content">
        <h1 className="terms-title">Terms of Use</h1>
        <p className="terms-updated">Last updated: March 2026</p>

        <div className="terms-notice">
          <strong>Educational Project Notice</strong>
          <p>
            Bright-Scraper is a personal learning project built for educational purposes only.
            It is not a commercial product or a production-grade service. By using this tool,
            you acknowledge and accept that it is provided solely as a demonstration of web
            scraping, AI extraction, and full-stack development techniques.
          </p>
        </div>

        <section>
          <h2>1. Purpose of This Project</h2>
          <p>
            Bright-Scraper was created as a learning project to explore and demonstrate the
            integration of modern web technologies, including:
          </p>
          <ul>
            <li><strong>BrightData Scraping Browser API</strong> — for navigating and fetching real web pages through a managed browser infrastructure</li>
            <li><strong>Anthropic Claude AI</strong> — for intelligent, natural-language data extraction from raw HTML</li>
            <li><strong>React + Node.js</strong> — full-stack web application development</li>
            <li><strong>MongoDB</strong> — user and session data persistence</li>
            <li><strong>JWT authentication</strong> — secure user login and session management</li>
          </ul>
          <p>
            This project is not intended for commercial use, mass data collection, or any
            purpose beyond personal education and skill development.
          </p>
        </section>

        <section>
          <h2>2. Acceptance of Terms</h2>
          <p>
            By registering or using Bright-Scraper, you confirm that you have read, understood,
            and agree to these Terms of Use. If you do not agree, please do not use this service.
          </p>
        </section>

        <section>
          <h2>3. Third-Party Services</h2>
          <p>Bright-Scraper relies on the following third-party services to function:</p>
          <ul>
            <li>
              <strong>BrightData</strong> (<a href="https://brightdata.com" target="_blank" rel="noreferrer">brightdata.com</a>) —
              provides the Scraping Browser infrastructure used to fetch web pages. Your scraping
              requests are routed through BrightData's network. BrightData's own Terms of Service
              and Acceptable Use Policy apply to all requests made through the platform.
            </li>
            <li>
              <strong>Anthropic Claude</strong> (<a href="https://anthropic.com" target="_blank" rel="noreferrer">anthropic.com</a>) —
              processes page content and extracts structured data using AI. Content you scrape
              is sent to Anthropic's API for processing. Anthropic's Privacy Policy and Usage
              Policies apply.
            </li>
            <li>
              <strong>MongoDB Atlas</strong> — used to store user accounts and scrape history.
            </li>
          </ul>
          <p>
            By using Bright-Scraper, you also agree to the terms and policies of these
            third-party providers. We are not responsible for their availability, accuracy,
            or changes to their services.
          </p>
        </section>

        <section>
          <h2>4. Permitted Use</h2>
          <p>You may use Bright-Scraper only for:</p>
          <ul>
            <li>Personal, non-commercial, educational purposes</li>
            <li>Exploring and learning web scraping and AI extraction techniques</li>
            <li>Scraping publicly accessible web pages that do not require authentication</li>
          </ul>
        </section>

        <section>
          <h2>5. Prohibited Use</h2>
          <p>You may <strong>not</strong> use Bright-Scraper to:</p>
          <ul>
            <li>Scrape websites in violation of their Terms of Service or robots.txt</li>
            <li>Collect, store, or distribute personal data of third parties without lawful basis</li>
            <li>Engage in any illegal activity, including copyright infringement or privacy violations</li>
            <li>Attempt to overload, disrupt, or damage any website, server, or service</li>
            <li>Automate mass scraping or run the service at scale for commercial gain</li>
            <li>Circumvent access controls, CAPTCHAs, or rate limits on third-party websites</li>
            <li>Scrape sensitive, private, or confidential information</li>
          </ul>
        </section>

        <section>
          <h2>6. Data & Privacy</h2>
          <p>
            When you register, we collect your email address and store a hashed version of
            your password. We store your scraping prompts and results to provide the history
            feature. Specifically:
          </p>
          <ul>
            <li>Your email is used only for authentication and account verification</li>
            <li>Scraping history (prompts and results) is stored and visible to you and site administrators</li>
            <li>We do not sell your data to any third party</li>
            <li>Content you scrape is transmitted to BrightData and Anthropic as part of the service</li>
          </ul>
          <p>
            You can request deletion of your account and data by contacting us at the email
            below.
          </p>
        </section>

        <section>
          <h2>7. Rate Limits & Fair Use</h2>
          <p>
            To protect the underlying APIs and infrastructure, scraping is rate-limited to
            20 requests per 15 minutes per user. Attempting to circumvent these limits may
            result in account suspension.
          </p>
        </section>

        <section>
          <h2>8. No Warranty / Disclaimer</h2>
          <p>
            Bright-Scraper is provided <strong>"as is"</strong> without any warranty of any kind,
            express or implied. As an educational project, it may be unstable, unavailable,
            or produce inaccurate results. We make no guarantees about:
          </p>
          <ul>
            <li>The accuracy or completeness of scraped data</li>
            <li>The availability or uptime of the service</li>
            <li>Compatibility with any specific website or data source</li>
          </ul>
          <p>
            Use this tool at your own risk. We are not liable for any damages, losses, or
            legal issues arising from your use of this service.
          </p>
        </section>

        <section>
          <h2>9. Intellectual Property</h2>
          <p>
            You are responsible for ensuring that any data you scrape does not infringe on
            the intellectual property rights of third parties. Bright-Scraper does not grant
            you any rights to scraped content — all rights remain with the original content owners.
          </p>
        </section>

        <section>
          <h2>10. Changes to These Terms</h2>
          <p>
            We may update these Terms of Use at any time. The "Last updated" date at the top
            of this page will reflect any changes. Continued use of the service after changes
            are posted constitutes your acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>
            Questions, concerns, or data deletion requests? Contact us at{' '}
            <a href="mailto:matanmu@gmail.com">matanmu@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
