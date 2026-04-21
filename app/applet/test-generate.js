async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_state: { story_type: 'adventure', num_characters: 1, history: [], metrics: {} },
        user_choice: null,
        rollback_count: 0
      })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
