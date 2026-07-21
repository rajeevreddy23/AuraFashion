export function resizeBase64Image(base64Str: string, maxDim: number = 800, quality: number = 0.8): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith("data:")) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };

    img.onerror = () => {
      resolve(base64Str);
    };

    img.src = base64Str;
  });
}

export async function tryOnDress(userImageBase64: string, dressImageBase64: string): Promise<string> {
  try {
    const compressedUser = await resizeBase64Image(userImageBase64, 800, 0.8);
    const compressedDress = await resizeBase64Image(dressImageBase64, 800, 0.8);

    const response = await fetch('/api/tryon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userImageBase64: compressedUser, dressImageBase64: compressedDress }),
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
    const compressedSketch = await resizeBase64Image(sketchBase64, 800, 0.8);
    let compressedUser: string | undefined = undefined;
    if (userImageBase64) {
      compressedUser = await resizeBase64Image(userImageBase64, 800, 0.8);
    }

    const response = await fetch('/api/process-sketch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sketchBase64: compressedSketch,
        dressType,
        userImageBase64: compressedUser,
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


