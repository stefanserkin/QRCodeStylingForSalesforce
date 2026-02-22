/***********************************************************************
 * @license
 * MIT License
 * Copyright (c) 2026 SerkinSolutions
 * See the LICENSE file in the project root for full license text.
 *
 * @description
 * Generate a QR Code using the QR Code Styling JS library
 *
 * Value modes:
 *  1) Record field mode (Lightning Record Pages): qrCodeValueFieldApiName is set
 *  2) Experience Cloud mode:
 *     - valueSource = "URL Parameter" -> reads from CurrentPageReference.state[urlParamName]
 *     - valueSource = "Provided Value" -> uses providedValue
 *
 * @date 2026
 * @author SerkinSolutions
 ***********************************************************************/
import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { CurrentPageReference } from 'lightning/navigation';
import { loadScript } from 'lightning/platformResourceLoader';
import QrCodeStylingLib from '@salesforce/resourceUrl/qrCodeStyling';

export default class QrCode extends LightningElement {
    @api recordId;
    @api objectApiName;

    // Record page mode
    @api qrCodeValueFieldApiName;

    // Experience Cloud value mode
    @api valueSource = 'Provided Value'; // "Provided Value" | "URL Parameter"
    @api providedValue;
    @api urlParamName = 'qrv';

    // Title
    @api showTitle;
    @api titleFieldApiName;
    @api titleStaticValue;

    // QR styling
    @api qrCodeHeight;
    @api qrCodeWidth;
    @api qrCodeDotsColor;
    @api qrCodeDotsType = 'Rounded';
    @api backgroundColor;
    @api cornersSquareStyle;
    @api cornersDotStyle;

    // Logo
    @api logoUrl;
    @api logoImageSize;
    @api logoImageMargin;

    @api noQrValueMessage;

    @track record;
    error;

    urlParamValue;

    qrCodeInstance;
    qrCodeLibLoaded = false;
    domReady = false;
    scriptLoadStarted = false;

    /******************************
     * Mode helpers
     ******************************/

    get usesRecordField() {
        return !!(this.recordId && this.objectApiName && this.qrCodeValueFieldApiName);
    }

    get effectiveUrlParamName() {
        return (this.urlParamName || 'qrv').trim();
    }

    /******************************
     * Data wiring
     ******************************/

    get fields() {
        if (!this.usesRecordField) return [];

        return [
            this.getQualifiedFieldName(this.titleFieldApiName),
            this.getQualifiedFieldName(this.qrCodeValueFieldApiName)
        ].filter(Boolean);
    }

    @wire(getRecord, { recordId: '$recordId', fields: '$fields' })
    wiredRecord({ data, error }) {
        if (data) {
            this.record = data;
            this.error = undefined;
            this.tryRenderOrUpdateQr();
        } else if (error) {
            this.record = undefined;
            this.error = error;
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }

    @wire(CurrentPageReference)
    wiredPageRef(pageRef) {
        if (this.usesRecordField) return;

        if (this.valueSource !== 'URL Parameter') {
            this.urlParamValue = null;
            return;
        }

        const key = this.effectiveUrlParamName;
        const raw = key ? pageRef?.state?.[key] : null;
        this.urlParamValue = raw || null;
        this.tryRenderOrUpdateQr();
    }

    /******************************
     * Computed values
     ******************************/

    get title() {
        if (!this.showTitle) return null;

        // Prefer record field title if configured and available
        if (this.record && this.titleFieldApiName) {
            const qualified = this.getQualifiedFieldName(this.titleFieldApiName);
            const val = qualified ? getFieldValue(this.record, qualified) : null;
            if (val) return val;
        }

        return this.titleStaticValue || 'QR Code';
    }

    get qrValueResolved() {
        // Record-field mode (Lightning Record Pages)
        if (this.usesRecordField) {
            if (!this.record) return null;
            const qualified = this.getQualifiedFieldName(this.qrCodeValueFieldApiName);
            return qualified ? getFieldValue(this.record, qualified) : null;
        }

        // Experience Cloud mode
        if (this.valueSource === 'URL Parameter') {
            return this.urlParamValue || null;
        }

        // Default: Provided Value
        return this.providedValue || null;
    }

    get hasQrValue() {
        return !!this.qrValueResolved;
    }

    get noValueMessage() {
        return this.noQrValueMessage || 'QR code is not available.';
    }

    get isReadyToRender() {
        if (!this.domReady || !this.qrCodeLibLoaded) return false;
        if (this.usesRecordField) return !!this.record;
        return true;
    }

    /******************************
     * Lifecycle hooks
     ******************************/

    connectedCallback() {
        if (this.scriptLoadStarted) return;
        this.scriptLoadStarted = true;

        loadScript(this, QrCodeStylingLib)
            .then(() => {
                this.qrCodeLibLoaded = true;
                this.tryRenderOrUpdateQr();
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.error('Error loading qr-code-styling:', error);
            });
    }

    renderedCallback() {
        if (!this.domReady) {
            this.domReady = true;
        }
        this.tryRenderOrUpdateQr();
    }

    /******************************
     * Draw QR
     ******************************/

    tryRenderOrUpdateQr() {
        if (!this.isReadyToRender) return;

        const qrDiv = this.template.querySelector('.qrcode');
        if (!qrDiv) return;

        const value = this.qrValueResolved;

        // If there's no value, clear any previously-rendered QR
        if (!value) {
            if (this.qrCodeInstance) {
                qrDiv.innerHTML = '';
                this.qrCodeInstance = null;
            }
            return;
        }

        const options = this.buildOptions(value);

        if (!this.qrCodeInstance) {
            qrDiv.innerHTML = '';
            this.qrCodeInstance = new QRCodeStyling(options);
            this.qrCodeInstance.append(qrDiv);
        } else {
            this.qrCodeInstance.update(options);
        }
    }

    buildOptions(data) {
        const dotsType = (this.qrCodeDotsType || 'Rounded').toLowerCase();

        const options = {
            width: this.qrCodeWidth,
            height: this.qrCodeHeight,
            data,
            dotsOptions: {
                color: this.qrCodeDotsColor,
                type: dotsType
            },
            backgroundOptions: {
                color: this.backgroundColor
            },
            cornersSquareOptions: {
                type: this.cornersSquareStyle === 'None'
                    ? undefined
                    : (this.cornersSquareStyle || undefined)?.toLowerCase?.(),
                color: this.qrCodeDotsColor
            },
            cornersDotOptions: {
                type: this.cornersDotStyle === 'None'
                    ? undefined
                    : (this.cornersDotStyle || undefined)?.toLowerCase?.(),
                color: this.qrCodeDotsColor
            },
            qrOptions: {
                errorCorrectionLevel: 'H'
            }
        };

        if (this.logoUrl) {
            options.image = this.logoUrl;
            options.imageOptions = {
                crossOrigin: 'anonymous',
                margin: this.logoImageMargin || 5,
                imageSize: this.logoImageSize || 0.5,
                hideBackgroundDots: true
            };
        }

        return options;
    }

    /******************************
     * Utilities
     ******************************/

    getQualifiedFieldName(fieldName) {
        const field = (fieldName || '').trim();
        if (!field) return null;
        if (!this.objectApiName) return null;
        return `${this.objectApiName}.${field}`;
    }

}