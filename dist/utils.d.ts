/// <reference types="node" />
export declare function crc16_ccitt(data: Buffer): number;
export interface PaymentType {
    [key: string]: number;
}
export declare const PaymentTypes: PaymentType;
