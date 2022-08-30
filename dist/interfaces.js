"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosnetItem = void 0;
/**
 * name: Name of goods - Up to 40 characters
 * vat: VAT rate - Rate number provided (0 - 6)
 * price: Price of goods - Up to 9999999999
 * cancellationFlag: Item cancellation flag false-no cancellation, true – item cancellation - Default false
 * totalAmount: Total amount - Up to 9999999999
 * qty: Number of goods - Default 1,000
 * description: Goods description - Default empty. Up to 35 characters
 * unit: Measure unit - Up to 4 characters
 * discountType: Discount(true)/narzut(false) - Default discount
 * discountName: Discount/surcharge name - Default empty. Up to 25 characters
 * percentDiscount: Per cent discount/surcharge value - Up to 99.99%
 * amountDiscount: Amount discount/surcharge value - Discount can nt exceed the value of goods. The total of surcharge and price of goods can not exceed the scope of wa parameter
 */
var PosnetItem = /** @class */ (function () {
    function PosnetItem(args) {
        var _a;
        this.name = args.name;
        this.vat = args.vat;
        this.price = args.price;
        this.cancellationFlag = (_a = args.cancellationFlag) !== null && _a !== void 0 ? _a : false;
        this.totalAmount = args.totalAmount;
        this.qty = args.qty;
        this.description = args.description;
        this.unit = args.unit;
        this.discountType = args.discountType;
        this.discountName = args.discountName;
        this.percentDiscount = args.percentDiscount;
        this.amountDiscount = args.amountDiscount;
    }
    return PosnetItem;
}());
exports.PosnetItem = PosnetItem;
