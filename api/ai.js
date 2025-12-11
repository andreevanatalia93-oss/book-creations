import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  maxDuration: 10,
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { task, data } = req.body;

  // ============ TASK: SELECT TOPIC ============
  if (task === 'select-topic') {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert in self-help book topics for Etsy. Select unique, trending therapeutic workbook topics. Always respond with valid JSON only, no markdown.`
          },
          {
            role: 'user',
            content: `Select a NEW unique topic for a therapeutic workbook. 
            
Avoid these already used topics: ${data.usedTopics?.join(', ') || 'none'}

Choose from categories like:
- Anxiety & Stress Management
- Trauma Recovery (PTSD, childhood trauma, betrayal trauma)
- Self-Esteem & Confidence
- Grief & Loss Processing
- Anger Management
- Codependency Recovery
- Burnout Recovery
- Inner Child Healing
- Boundaries & Assertiveness
- Overthinking & Rumination
- People Pleasing Recovery
- Perfectionism
- Emotional Regulation
- Mindfulness & Meditation
- Shadow Work
- Self-Compassion

Return ONLY this JSON (no markdown, no code blocks):
{
  "chosen_topic": "Specific Topic Name",
  "seo_title": "SEO Title for Etsy - max 140 chars with keywords",
  "cover_subtitle": "Descriptive subtitle with therapeutic approach mentioned",
  "main_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "target_audience": "Specific description of who this is for",
  "suggested_accent_color": "#hexcolor",
  "color_mood": "warm or cool or neutral",
  "etsy_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13"],
  "chapter5_title": "Understanding [Specific Aspect of Topic]"
}`
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content;
      
      // Попытка парсинга JSON
      let parsed;
      try {
        // Убираем возможные markdown блоки
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleanContent);
      } catch (e) {
        // Пытаемся извлечь JSON из текста
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse JSON from response');
        }
      }

      return res.json({ success: true, data: parsed });
    } catch (error) {
      console.error('select-topic error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ============ TASK: REWRITE CONTENT ============
  if (task === 'rewrite-content') {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert therapeutic content writer. Rewrite workbook content for new topics while maintaining the same structure, therapeutic tone, and approximate length. Always respond with valid JSON only.`
          },
          {
            role: 'user',
            content: `Rewrite these book sections for: "${data.topic}"

Keywords to use: ${data.keywords?.join(', ')}
Target audience: ${data.targetAudience}
Chapter 5 title: ${data.chapter5Title}

Return ONLY this JSON (no markdown):
{
  "introduction": {
    "greeting": "Dear Reader,",
    "opening_paragraph": "Write 2-3 sentences about why they picked up this workbook and validation of their journey (150-200 chars)",
    "quote": {
      "text": "Relevant therapeutic quote",
      "author": "Author Name"
    },
    "why_this_works": "2-3 sentences about the therapeutic approach used (CBT, IFS, somatic, etc)",
    "closing": "Warm closing sentence welcoming them to the journey"
  },
  "chapter2": {
    "title": "THE SCIENCE BEHIND [TOPIC]",
    "mechanism": "Explain the psychological/neurological basis (2-3 sentences)",
    "power_section": "Why this workbook approach is effective (2 sentences)",
    "effectiveness": "Research-backed statement about recovery/improvement"
  },
  "chapter3": {
    "title": "[TOPIC] MAP - IDENTIFYING PATTERNS",
    "intro": "Opening paragraph about mapping their experience",
    "core_wound": "The fundamental wound or belief at the center",
    "manifestations": ["How it shows up 1", "How it shows up 2", "How it shows up 3"],
    "mask": "The protective behavior or facade developed",
    "example_quote": "Example of internal dialogue related to this issue",
    "parable": {
      "title": "The Parable of [Metaphor]",
      "content": "Short therapeutic metaphor story (3-4 sentences)"
    }
  },
  "chapter4": {
    "title": "SELF-ASSESSMENT - YOUR [TOPIC] INVENTORY",
    "intro": "Brief intro to the assessment",
    "questions": [
      "Assessment question 1?",
      "Assessment question 2?",
      "Assessment question 3?",
      "Assessment question 4?",
      "Assessment question 5?"
    ]
  },
  "chapter5": {
    "title": "${data.chapter5Title}",
    "quote": {
      "text": "Relevant quote for this chapter",
      "author": "Author"
    },
    "what_makes_different": "2-3 sentences about unique aspects of this specific issue",
    "hidden_symptoms": {
      "symptom1": {"name": "Symptom Name", "description": "Brief description"},
      "symptom2": {"name": "Symptom Name", "description": "Brief description"},
      "symptom3": {"name": "Symptom Name", "description": "Brief description"}
    },
    "body_manifestations": ["Physical symptom 1", "Physical symptom 2", "Physical symptom 3"],
    "protective_parts": ["Defense mechanism 1", "Defense mechanism 2", "Defense mechanism 3"],
    "remember_note": "Compassionate reminder about healing not being linear"
  }
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      const content = response.choices[0].message.content;
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let parsed;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (e) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse rewrite content JSON');
        }
      }

      return res.json({ success: true, data: parsed });
    } catch (error) {
      console.error('rewrite-content error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ============ TASK: ANALYZE COLORS ============
  if (task === 'analyze-colors') {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert color palette designer for book interiors. Create harmonious, readable color schemes. Always respond with valid JSON only.`
          },
          {
            role: 'user',
            content: `Create an interior color palette based on:
Accent color from cover: ${data.accentColor}
Color mood: ${data.colorMood}
Topic: ${data.topic}

Requirements:
- Text must be highly readable (dark on light)
- Accent colors used sparingly for headers/highlights
- Calming, therapeutic feel
- Professional appearance

Return ONLY this JSON:
{
  "main_bg_color": "#ffffff",
  "text_color": "#2d2d2d or similar dark color",
  "accent_color": "#hex - derived from cover accent",
  "secondary_accent": "#hex - lighter version of accent",
  "light_gray": "#hex - very light, almost white",
  "light_viol": "#hex - subtle tinted background",
  "mid_gray": "#hex - for borders and lines",
  "dark_gray": "#hex - for secondary text",
  "soft_green": "#hex - for success/positive elements",
  "box_shadow_rgba": "rgba(R, G, B, 0.12)",
  "gradient_start": "#hex",
  "gradient_end": "#hex",
  "paper_texture_rgba": "rgba(R, G, B, 0.03)",
  "color_description": "Brief description of the palette mood"
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const content = response.choices[0].message.content;
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let parsed;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (e) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse color JSON');
        }
      }

      return res.json({ success: true, data: parsed });
    } catch (error) {
      console.error('analyze-colors error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ============ TASK: GENERATE PINTEREST TITLE ============
  if (task === 'pinterest-title') {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You create viral Pinterest pin titles for self-help products. Short, emotional, action-oriented.`
          },
          {
            role: 'user',
            content: `Create a Pinterest-style title for a workbook about: ${data.topic}
            
Target audience: ${data.targetAudience}

Requirements:
- Max 8-10 words
- Emotional hook
- Use words like: Finally, Secret, Transform, Heal, Free, Peace, etc.
- No hashtags

Return ONLY the title text, nothing else.`
          }
        ],
        temperature: 0.9,
        max_tokens: 50,
      });

      return res.json({ 
        success: true, 
        data: { title: response.choices[0].message.content.trim().replace(/"/g, '') }
      });
    } catch (error) {
      console.error('pinterest-title error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(400).json({ error: 'Unknown task. Use: select-topic, rewrite-content, analyze-colors, pinterest-title' });
}
