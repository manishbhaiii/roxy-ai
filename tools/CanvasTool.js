const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

async function generateCanvasImage(instructions, outPath) {
    let canvasWidth = 800;
    let canvasHeight = 600;

    // Check if the first instruction sets the size
    if (instructions[0] && instructions[0].type === 'size') {
        canvasWidth = instructions[0].width || canvasWidth;
        canvasHeight = instructions[0].height || canvasHeight;
        instructions.shift(); // remove size command
    }

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Default white background if not specified
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let inst of instructions) {
        if (!inst || !inst.type) continue;
        
        ctx.save();
        if (inst.color) {
            if (inst.fill !== false) ctx.fillStyle = inst.color;
            ctx.strokeStyle = inst.color;
        }

        switch (inst.type.toLowerCase()) {
            case 'background':
                ctx.fillStyle = inst.color || '#ffffff';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                break;
            case 'rect':
                if (inst.fill !== false) ctx.fillRect(inst.x, inst.y, inst.w, inst.h);
                else ctx.strokeRect(inst.x, inst.y, inst.w, inst.h);
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(inst.x, inst.y, inst.r, 0, 2 * Math.PI);
                if (inst.fill !== false) ctx.fill();
                else ctx.stroke();
                break;
            case 'line':
                ctx.beginPath();
                ctx.moveTo(inst.x1, inst.y1);
                ctx.lineTo(inst.x2, inst.y2);
                if (inst.width) ctx.lineWidth = inst.width;
                ctx.stroke();
                break;
            case 'text':
                ctx.font = `${inst.size || 20}px ${inst.font || 'sans-serif'}`;
                ctx.textAlign = inst.align || 'left';
                if (inst.fill !== false) ctx.fillText(inst.text, inst.x, inst.y);
                else ctx.strokeText(inst.text, inst.x, inst.y);
                break;
        }
        ctx.restore();
    }

    return new Promise((resolve, reject) => {
        try {
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outPath, buffer);
            resolve(outPath);
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = { generateCanvasImage };
