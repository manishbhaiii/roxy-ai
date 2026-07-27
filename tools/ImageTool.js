function generateImage(prompt, model, width, height) {
    const encodedPrompt = encodeURIComponent(prompt);
    const finalModel = model || "flux";
    const finalWidth = width || 1024;
    const finalHeight = height || 1024;
    
    return { url: `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${finalModel}&width=${finalWidth}&height=${finalHeight}&nologo=true` };
}

module.exports = { generateImage };
