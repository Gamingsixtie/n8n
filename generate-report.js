// Genereer uitgebreid eindrapport
const results = $input.first().json;
const processingTime = Date.now() - new Date(results.school.timestamp).getTime();

// Bouw rapport structuur
const rapport = {
  school: {
    naam: results.school.naam,
    website: results.school.url,
    domain: results.school.domain,
    timestamp: results.school.timestamp
  },
  samenvatting: {
    kwaliteitsscore: results.kwaliteitsscore.totaal,
    paginasGescraped: results.stats.paginasGescraped,
    contactenGevonden: results.stats.contactenGevonden,
    pdfGevonden: results.stats.pdfGevonden
  },
  contactgegevens: {
    emails: results.contactgegevens.emails,
    telefoons: results.contactgegevens.telefoons
  },
  contactpersonen: results.contactpersonen,
  systemen: results.systemen,
  documenten: results.documenten,
  belangrijkeInformatie: results.belangrijkeContent,
  pdfAnalyse: results.pdfAnalysis || { status: 'Niet uitgevoerd' },
  meta: {
    processingTime: `${Math.round(processingTime / 1000)}s`,
    timestamp: new Date().toISOString()
  },
  aanbevelingen: [],
  technischeDetails: {
    apifyRuns: {
      websiteContentCrawler: results.websiteRunId || 'N/A',
      contactInfoScraper: results.contactRunId || 'N/A'
    },
    errors: results.errors
  }
};

// Voeg aanbevelingen toe op basis van resultaten
if (!results.systemen.leerlingvolgsysteem) {
  rapport.aanbevelingen.push('Leerlingvolgsysteem niet automatisch gedetecteerd - handmatige verificatie aanbevolen');
}

if (results.contactgegevens.emails.length === 0) {
  rapport.aanbevelingen.push('Geen email adressen gevonden - controleer contact pagina handmatig');
}

if (results.stats.pdfGevonden === 0) {
  rapport.aanbevelingen.push('Geen PDF documenten gevonden - mogelijk staan belangrijke documenten achter een login');
}

if (results.kwaliteitsscore.totaal < 75) {
  rapport.aanbevelingen.push('Lage kwaliteitsscore - overweeg handmatige aanvulling van de data');
}

// Genereer Markdown versie
const markdown = `# School Scraping Rapport - ${rapport.school.naam}

## 📊 Samenvatting
- **Website:** ${rapport.school.website}
- **Kwaliteitsscore:** ${rapport.samenvatting.kwaliteitsscore}
- **Verwerkingstijd:** ${rapport.meta.processingTime}
- **Pagina's gescraped:** ${rapport.samenvatting.paginasGescraped}
- **Contacten gevonden:** ${rapport.samenvatting.contactenGevonden}

## 📧 Contactgegevens
### Email adressen
${rapport.contactgegevens.emails.length > 0 ? rapport.contactgegevens.emails.map(e => `- ${e}`).join('\n') : '- Geen emails gevonden'}

### Telefoonnummers
${rapport.contactgegevens.telefoons.length > 0 ? rapport.contactgegevens.telefoons.map(t => `- ${t}`).join('\n') : '- Geen telefoonnummers gevonden'}

### Contactpersonen
${rapport.contactpersonen.length > 0 ? rapport.contactpersonen.map(p => `- **${p.naam}** ${p.linkedIn ? `- [LinkedIn](${p.linkedIn})` : ''}`).join('\n') : '- Geen contactpersonen gevonden'}

## 💻 Systemen
- **Leerlingvolgsysteem:** ${rapport.systemen.leerlingvolgsysteem || 'Niet gevonden'}
- **Administratiesysteem:** ${rapport.systemen.administratiesysteem || 'Niet gevonden'}

## 📄 Belangrijke Informatie
${rapport.belangrijkeInformatie.length > 0 ? rapport.belangrijkeInformatie.map(info => `### ${info.type}\n${info.content}\n*Bron: ${info.url}*`).join('\n\n') : 'Geen visie/missie informatie gevonden'}

## 📑 Documenten
${rapport.documenten.length > 0 ? rapport.documenten.map(doc => `- [${doc.naam}](${doc.url})`).join('\n') : '- Geen documenten gevonden'}

## 🔍 PDF Analyse
Status: ${rapport.pdfAnalyse.status}
${rapport.pdfAnalyse.documenten ? rapport.pdfAnalyse.documenten.map(pdf => `
### ${pdf.naam}
- Info score: ${pdf.infoScore}/5
${Object.entries(pdf.gevondenInfo).map(([key, value]) => `- **${key}:** ${Array.isArray(value) ? value.join(', ') : value}`).join('\n')}
`).join('\n') : ''}

## 💡 Aanbevelingen
${rapport.aanbevelingen.length > 0 ? rapport.aanbevelingen.map(a => `- ${a}`).join('\n') : '- Alle belangrijke informatie succesvol gevonden!'}

---
*Gegenereerd met n8n + Apify School Scraper*`;

return {
  json: rapport,
  markdown: markdown,
  binary: {
    rapport: {
      data: Buffer.from(JSON.stringify(rapport, null, 2)).toString('base64'),
      mimeType: 'application/json',
      fileName: `school-rapport-${rapport.school.naam.replace(/\s+/g, '-')}.json`
    },
    markdownRapport: {
      data: Buffer.from(markdown).toString('base64'),
      mimeType: 'text/markdown',
      fileName: `school-rapport-${rapport.school.naam.replace(/\s+/g, '-')}.md`
    }
  }
};