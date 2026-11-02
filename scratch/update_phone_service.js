const fs = require('fs');

const serviceFile = 'backend/src/services/phoneService.js';
let serviceText = fs.readFileSync(serviceFile, 'utf8');

// 1. addStock
const addStockRegex = /(const addedQty = Number\(quantity\);[\s\S]*?const updated = await \(this\.phoneRepository \|\| phoneRepository\)\.addStock\(id, addedQty, newAvailability\);)/;

const newAddStock = `const addedQty = Number(quantity);
        const prevStock = Number(phone.current_stock || 0);

        let updatedColours = null;
        let newStock = prevStock + addedQty;

        if (phone.colour_options) {
            let cols = phone.colour_options;
            if (typeof cols === 'string') {
                try { cols = JSON.parse(cols); } catch { cols = []; }
            }
            if (Array.isArray(cols) && cols.length > 0) {
                const targetColor = data.color_name || (cols.length === 1 ? (cols[0].color_name || cols[0].name) : null);

                cols = cols.map((c, i) => {
                    const colObj = typeof c === 'string'
                        ? { name: c, color_name: c, color_code: '#4B5563', photos: [], quantity: 0 }
                        : { ...c };
                    if (colObj.quantity === undefined || colObj.quantity === null) {
                        colObj.quantity = (i === 0 ? prevStock : 0);
                    } else {
                        colObj.quantity = Number(colObj.quantity) || 0;
                    }
                    return colObj;
                });

                if (targetColor) {
                    let matched = false;
                    for (const c of cols) {
                        if ((c.name && c.name.toLowerCase() === targetColor.toLowerCase()) ||
                            (c.color_name && c.color_name.toLowerCase() === targetColor.toLowerCase())) {
                            c.quantity = (Number(c.quantity) || 0) + addedQty;
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) {
                        cols[0].quantity = (Number(cols[0].quantity) || 0) + addedQty;
                    }
                } else {
                    cols[0].quantity = (Number(cols[0].quantity) || 0) + addedQty;
                }

                updatedColours = cols;
                newStock = cols.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
            }
        }

        // Auto-assign availability according to unified business rules
        const lowStockLevel = Number(phone.low_stock_level ?? 5);
        const newAvailability = calculatePhoneAvailability(newStock, lowStockLevel, phone.availability);

        let updated;
        if (updatedColours && typeof (this.phoneRepository || phoneRepository).updateStockWithColours === 'function') {
            updated = await (this.phoneRepository || phoneRepository).updateStockWithColours(id, newStock, newAvailability, updatedColours);
        } else {
            updated = await (this.phoneRepository || phoneRepository).addStock(id, addedQty, newAvailability);
        }`;

// 2. removeStock
const removeStockRegex = /(const newStock = prevStock - removedQty;[\s\S]*?const updated = await \(this\.phoneRepository \|\| phoneRepository\)\.removeStock\(id, removedQty, newAvailability\);)/;

const newRemoveStock = `let updatedColours = null;
        let newStock = prevStock - removedQty;

        if (phone.colour_options) {
            let cols = phone.colour_options;
            if (typeof cols === 'string') {
                try { cols = JSON.parse(cols); } catch { cols = []; }
            }
            if (Array.isArray(cols) && cols.length > 0) {
                const targetColor = data.color_name || (cols.length === 1 ? (cols[0].color_name || cols[0].name) : null);

                cols = cols.map((c, i) => {
                    const colObj = typeof c === 'string'
                        ? { name: c, color_name: c, color_code: '#4B5563', photos: [], quantity: 0 }
                        : { ...c };
                    if (colObj.quantity === undefined || colObj.quantity === null) {
                        colObj.quantity = (i === 0 ? prevStock : 0);
                    } else {
                        colObj.quantity = Number(colObj.quantity) || 0;
                    }
                    return colObj;
                });

                if (targetColor) {
                    for (const c of cols) {
                        if ((c.name && c.name.toLowerCase() === targetColor.toLowerCase()) ||
                            (c.color_name && c.color_name.toLowerCase() === targetColor.toLowerCase())) {
                            if (c.quantity < removedQty) {
                                throw new AppError(\`Cannot deduct \${removedQty} units from color '\${c.name}'. Available for this color is only \${c.quantity}.\`, 400);
                            }
                            c.quantity = Math.max(0, (Number(c.quantity) || 0) - removedQty);
                            break;
                        }
                    }
                } else {
                    cols[0].quantity = Math.max(0, (Number(cols[0].quantity) || 0) - removedQty);
                }

                updatedColours = cols;
                newStock = cols.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
            }
        }

        // Auto-assign availability according to unified business rules
        const lowStockLevel = Number(phone.low_stock_level ?? 5);
        const newAvailability = calculatePhoneAvailability(newStock, lowStockLevel, phone.availability);

        let updated;
        if (updatedColours && typeof (this.phoneRepository || phoneRepository).updateStockWithColours === 'function') {
            updated = await (this.phoneRepository || phoneRepository).updateStockWithColours(id, newStock, newAvailability, updatedColours);
        } else {
            updated = await (this.phoneRepository || phoneRepository).removeStock(id, removedQty, newAvailability);
        }`;

if (addStockRegex.test(serviceText)) {
    serviceText = serviceText.replace(addStockRegex, newAddStock);
    console.log('addStock replaced successfully');
} else {
    console.log('addStockRegex did not match');
}

if (removeStockRegex.test(serviceText)) {
    serviceText = serviceText.replace(removeStockRegex, newRemoveStock);
    console.log('removeStock replaced successfully');
} else {
    console.log('removeStockRegex did not match');
}

fs.writeFileSync(serviceFile, serviceText, 'utf8');
console.log('Wrote updated phoneService.js');
