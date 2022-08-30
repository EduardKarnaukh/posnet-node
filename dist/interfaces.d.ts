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
