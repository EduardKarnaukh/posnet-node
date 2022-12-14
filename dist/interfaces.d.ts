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
export declare class PosnetItem {
    name: string;
    vat: number;
    price: number;
    cancellationFlag?: boolean;
    totalAmount?: number;
    qty?: number;
    description?: string;
    unit?: string;
    discountType?: boolean;
    discountName?: string;
    percentDiscount?: number;
    amountDiscount?: number;
    constructor(args: PosnetItemArgs);
}
export interface PosnetItemArgs {
    name: string;
    vat: number;
    price: number;
    cancellationFlag?: boolean;
    totalAmount?: number;
    qty?: number;
    description?: string;
    unit?: string;
    discountType?: boolean;
    discountName?: string;
    percentDiscount?: number;
    amountDiscount?: number;
}
export interface PosnetPaymentArgs {
    type: number;
    amount: number;
    change: number;
    form?: string;
    flag?: boolean;
}
export declare class PosnetPayment {
    type: number;
    amount: number;
    change: number;
    form?: string;
    flag?: boolean;
    constructor(args: PosnetPaymentArgs);
}
export declare class PosnetChange {
    amount: number;
    type: number;
    constructor(type: string, amount: number);
}
/**
 * @param {number} subtotal: fiscal sum of all goods
 * @param {number} paid: amount paid
 * @param {number} change: amount of change
 */
export declare class PosnetEndTransaction {
    subtotal: number;
    paid: number;
    change: number;
    constructor(subtotal: number, paid: number, change: number);
}
export declare class PosnetPromoDiscount {
    vat: number;
    value: number;
    name: string;
    constructor(vat: number, value: number, name: string);
}
export declare class PosnetDiscountVat {
    vat: number;
    value: number;
    valueInPercent: boolean;
    name: string;
    constructor(vat: number, name: string, value: number, valueInPercent?: boolean);
}
