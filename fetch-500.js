import fs from 'fs';

async function fetchQuestions() {
  const allQuestions = [];
  let idCounter = 1;
  
  const decodeHTML = (str) => str
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&shy;/g, '')
    .replace(/&hellip;/g, '...')
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&eacute;/g, 'é')
    .replace(/&Uuml;/g, 'Ü');

  fs.mkdirSync('./src/data', { recursive: true });

  for (let i = 0; i < 11; i++) {
    console.log(`Fetching batch ${i+1}...`);
    try {
      const res = await fetch('https://opentdb.com/api.php?amount=50&category=9&type=multiple'); // General knowledge
      if (!res.ok) {
        console.log('HTTP error', res.status);
        await new Promise(r => setTimeout(r, 6000));
        i--;
        continue;
      }
      const json = await res.json();
      if (json.response_code === 5) {
         console.log('Rate limited! Waiting 6s...');
         await new Promise(r => setTimeout(r, 6000));
         i--;
         continue;
      }
      
      for (const item of json.results) {
        const text = decodeHTML(item.question);
        if (!allQuestions.find(q => q.text === text)) {
           const options = [item.correct_answer, ...item.incorrect_answers].map(decodeHTML);
           allQuestions.push({
             id: idCounter++,
             text,
             options,
             correctAnswer: decodeHTML(item.correct_answer)
           });
        }
      }
      console.log(`Saved batch ${i+1}. Total so far: ${allQuestions.length}`);
      if (allQuestions.length >= 500) break;
    } catch (e) {
      console.log('Error', e);
      i--;
    }
    await new Promise(r => setTimeout(r, 6000)); // Respect OpenTDB 1 request per 5 seconds limit
  }
  
  const finalQuestions = allQuestions.slice(0, 500);
  console.log(`Total unique questions fetched: ${finalQuestions.length}`);
  fs.writeFileSync('./src/data/questions.json', JSON.stringify(finalQuestions, null, 2));
}

fetchQuestions();
