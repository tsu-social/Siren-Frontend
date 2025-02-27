<template>
    <div class="asigntransaction" :hidden="hidden || null" aria-hidden="true">
        <metamask-wallet-notice-window ref="metamaskNotice" :disabled="!tx.to" />
        <coinbase-wallet-notice-window ref="coinbaseNotice" :disabled="!tx.to" />
    </div>
</template>

<script>
import { eventBusMixin } from 'fantom-vue-components/src/mixins/event-bus.js';
// import { toBigNumber, toHex } from '@/utils/big-number.js';
import { SET_TX_STATUS } from '@/modules/app/store/mutations.js';
import MetamaskWalletNoticeWindow from '@/modules/wallet/components/MetamaskWalletNoticeWindow/MetamaskWalletNoticeWindow.vue';
import CoinbaseWalletNoticeWindow from '@/modules/wallet/components/CoinbaseWalletNoticeWindow/CoinbaseWalletNoticeWindow.vue';

/**
 * Transaction status object - 'transaction-status' event payload.
 * @typedef {Object} TransactionStatus
 * @property {('success'|'error'|'pending')} status
 * @property {string} data Tx hash (success) or error text (error)
 * @property {string} [code]
 */

/**
 *
 */
export default {
    name: 'ASignTransaction',

    components: { CoinbaseWalletNoticeWindow, MetamaskWalletNoticeWindow },

    mixins: [eventBusMixin],

    props: {
        tx: {
            type: Object,
            default() {
                return {};
            },
        },
        hidden: {
            type: Boolean,
            default: true,
        },
    },

    data() {
        return {
            status: '',
            // transaction code - just for transaction identification in emitted events
            code: '',
            // don't display errors
            silent: false,
        };
    },

    watch: {
        tx: {
            handler(value) {
                this.signTransaction(value);
            },
            immediate: true,
        },
    },

    methods: {
        async signTransaction(tx) {
            const { $wallet } = this;

            if (!tx || !tx.to) {
                return;
            }

            this.code = tx._code || '';
            this.silent = tx._silent || false;

            if (!$wallet.connected) {
                this._eventBus.emit('show-wallet-picker');
            } else {
                if (!$wallet.isCorrectChainId()) {
                    if ($wallet.is('metamask')) {
                        this.$refs.metamaskNotice.show();
                    } else if ($wallet.is('coinbase')) {
                        this.$refs.coinbaseNotice.show();
                    }

                    return;
                }

                try {
                    this.setStatus('pending');

                    if (!tx.from) {
                        tx.from = $wallet.account;
                    }

                    console.log('TX: ', tx);

                    tx.chainId = $wallet.chainId;
                    // tx.nonce = await $wallet.getNonce($wallet.account, true);
                    // console.log('nonce: ', tx.nonce);
                    // tx.from = $wallet.account;
                    //tx.gasPrice = await $wallet.getGasPrice(true);
                    // tx.gasLimit = await $wallet.estimateGas(tx, this.silent);
                    // tx.gasLimit = toHex(toBigNumber(tx.gasLimit).plus(2000));

                    if (!tx.from) {
                        tx.from = $wallet.account;
                    }

                    console.log('TX: ', tx);

                    const trx = await $wallet.signTransaction(tx, true);

                    if (trx.ok) {
                        this.setStatus('success', trx.txHash);
                    } else {
                        this.setStatus('error', { message: `Transaction ${trx.txHash} has failed.` });
                    }
                } catch (error) {
                    this.setStatus('error', error);
                    console.error(error);
                }
            }
        },

        setStatus(status, data) {
            this.status = status;

            if (status === 'error' && !this.silent) {
                this.$notifications.add({
                    type: 'error',
                    text: data.message,
                });
            }

            this.$store.commit(`app/${SET_TX_STATUS}`, { status, data, code: this.code });
            this.$emit('transaction-status', {
                status,
                data,
                code: this.code,
                error: status === 'error' ? data.message : '',
            });
        },
    },
};
</script>
