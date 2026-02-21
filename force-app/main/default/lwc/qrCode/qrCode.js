/***********************************************************************
 * @license
 * MIT License
 * Copyright (c) 2026 SerkinSolutions
 * See the LICENSE file in the project root for full license text.
 * 
 * @description
 * Generate a QR Code using the QR Code Styling JS library
 * 
 * @date 2026
 * @author SerkinSolutions
 ***********************************************************************/
import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { loadScript } from 'lightning/platformResourceLoader';
import QrCodeStylingLib from '@salesforce/resourceUrl/qrCodeStyling';

export default class QrCode extends LightningElement {
    @api recordId;
    @api qrCodeValueApiName;
    @api qrCodeHeight;
    @api qrCodeWidth;
    @api qrCodeDotsColor;
    @api qrCodeDotsType = 'Rounded';
    @api backgroundColor;
    @api cornersSquareStyle;
    @api cornersDotStyle;
    @api logoUrl;
    @api logoAltText;
    @api logoImageSize;
    @api logoImageMargin;
    @api showTitle;
    @api titleFieldApiName;
    @api objectApiName;

    @track record;
    error;

    qrCodeInstance;
    qrCodeLibLoaded = false;

    get title() {
        return this.record 
            ? getFieldValue(this.record, this.getQualifiedFieldName(this.titleFieldApiName)) 
            : 'QR Code';
    }

    get qrValue() {
        if (!this.record) return null;
        return getFieldValue(this.record, this.qrCodeValueApiName);
    }

    get fields() {
        if (!this.recordId) return null;

        return [
            this.getQualifiedFieldName(this.titleFieldApiName), 
            this.getQualifiedFieldName(this.qrCodeValueApiName)
        ];
    }

    renderedCallback() {
        if (this.qrCodeLibLoaded) return;
        this.qrCodeLibLoaded = true;

        loadScript(this, QrCodeStylingLib)
            .then(() => {
                this.generateQRCode();
            })
            .catch(error => {
                console.error('Error loading qr-code-styling:', error);
            });
    }

    @wire(getRecord, { recordId: '$recordId', fields: '$fields' })
    wiredRecord({ data, error }) {
        if (data) {
            this.record = data;
            this.error = undefined;
        } else if (error) {
            this.record = undefined;
            this.error = error;
            console.error(this.error);
        }
    }

    generateQRCode() {
        const qrDiv = this.template.querySelector('.qrcode');
        if (!qrDiv) {
            console.error('QR Code container not found.');
            return;
        }

        const options = {
            width: this.qrCodeWidth,
            height: this.qrCodeHeight,
            data: this.recordId || 'No Data',
            dotsOptions: {
                color: this.qrCodeDotsColor,
                type: this.qrCodeDotsType.toLowerCase()
            },
            backgroundOptions: {
                color: this.backgroundColor
            },
            cornersSquareOptions: {
                type: this.cornersSquareStyle === 'None' ? undefined : this.cornersSquareStyle.toLowerCase(),
                color: this.qrCodeDotsColor
            },
            cornersDotOptions: {
                type: this.cornersDotStyle === 'None' ? undefined : this.cornersDotStyle.toLowerCase(),
                color: this.qrCodeDotsColor
            },
            qrOptions: {
                errorCorrectionLevel: 'H'
            }
        };

        if (this.logoUrl) {
            options.image = this.logoUrl;
            options.imageOptions = {
                crossOrigin: "anonymous",
                margin: this.logoImageMargin || 5,
                imageSize: this.logoImageSize || 0.5,
                hideBackgroundDots: true,
            };
        }

        this.qrCodeInstance = new QRCodeStyling(options);
        this.qrCodeInstance.append(qrDiv);
    }

    getQualifiedFieldName(fieldName) {
        const field = (fieldName || 'Id').trim();
        if (!this.objectApiName) return null;
        return `${this.objectApiName}.${field}`;
    }

}