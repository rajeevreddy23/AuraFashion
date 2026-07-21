export async function tryOnDress(userImageBase64: string, dressImageBase64: string): Promise<string> {
  try {
    const response = await fetch('/api/tryon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userImageBase64, dressImageBase64 }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to process virtual try-on: status ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error: any) {
    console.error("Error in tryOnDress:", error);
    throw error;
  }
}

export async function processSketch(
  sketchBase64: string, 
  dressType: string, 
  userImageBase64?: string | null,
  instructions?: string
): Promise<string> {
  try {
    const response = await fetch('/api/process-sketch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sketchBase64,
        dressType,
        userImageBase64,
        instructions
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to process sketch: status ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error: any) {
    console.error("Error in processSketch:", error);
    throw error;
  }
}

