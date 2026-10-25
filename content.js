// Add another project here. The showcase and counter update automatically.
export const projects = [
  {
    name: 'Shared Ideas', kind: 'library', status: 'Web application',
    description: 'A team library for useful links, tools, tutorials and ideas. I mapped how people save and rediscover knowledge, planned the roadmap and application architecture, and brought the library through interface design, development and testing.',
    url: 'https://shared-ideas.vercel.app/', linkLabel: 'Explore live project', note: 'Team knowledge library',
    image: 'assets/shared-ideas-preview.png', imageAlt: 'Shared Ideas landing page for the Fieldnotes shared idea library.'
  },
  {
    name: 'BBSilog POS', kind: 'pos', status: 'Live web application',
    description: 'Designed around the daily rhythm of a small food business, this POS connects checkout, menu management, inventory and sales. I handled the delivery plan and system design, then built and tested the cashier and admin workflows before deployment.',
    demoLogin: { username: 'TEST', password: 'TEST' },
    url: 'https://bbsilog-pos.vercel.app/', linkLabel: 'Open live project', note: 'Operations / Point of sale',
    image: 'assets/bbsilog-pos-preview.png', imageAlt: 'BBSilog point-of-sale screen showing menu items and the current customer order.'
  }
];
