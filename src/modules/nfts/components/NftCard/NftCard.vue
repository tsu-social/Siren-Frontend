<template>
    <div class="nftcard">
        <router-link
            :to="{ name: 'nft-detail', params: { tokenContract: nftData.contract, tokenId: nftData.tokenId } }"
        >
            <div class="nftcard_content">
                <div class="nftcard_top">
                    <div class="nftcard_itemName">
                        <h3 class="nftcard_name" :data-tooltip="nftData.name">{{ nftData.name }}</h3>
                        <div v-if="nftData.collection" class="nftcard_label" :data-tooltip="nftData.collection.name">
                            {{ nftData.collection.name }}
                            <!--                            <app-iconset icon="check" />-->
                        </div>
                    </div>
                    <div v-if="nftData.auctionReservePrice || nftData.auctionedPrice" class="nftcard_price">
                        <div class="nftcard_label">
                            {{ !nftData.auctionedPrice ? $t('nftcard.minBid') : $t('nftcard.topBid') }}
                        </div>
                        <div v-if="nftData.auctionReservePrice && !nftData.auctionedPrice">
                            <a-token-value
                                :token="nftData.auctionReservePrice.payToken"
                                :value="nftData.auctionReservePrice.amount"
                                image-size="16px"
                                no-symbol
                            />
                        </div>
                        <div v-if="nftData.auctionedPrice">
                            <a-token-value
                                :token="nftData.auctionedPrice.payToken"
                                :value="nftData.auctionedPrice.amount"
                                image-size="16px"
                                no-symbol
                            />
                        </div>
                        <div v-if="auctionEndTime" class="nftcard_timeleft">
                            {{ auctionEndTime }} {{ $t('nftcard.left') }}
                        </div>
                    </div>
                    <div
                        v-else-if="nftData.listingPrice || nftData.offeredPrice || nftData.lastTradePrice"
                        class="nftcard_price"
                    >
                        <div class="nftcard_label">{{ $t('nftcard.price') }}</div>
                        <div v-if="nftData.listingPrice">
                            <a-token-value
                                :token="nftData.listingPrice.payToken"
                                :value="nftData.listingPrice.amount"
                                image-size="16px"
                                no-symbol
                            />
                        </div>
                        <div v-if="nftData.offeredPrice" class="nftcard_offerprice">
                            <span class="nftcard_offerprice_label">{{ $t('nftcard.offerFor') }}</span>
                            <a-token-value
                                :token="nftData.offeredPrice.payToken"
                                :value="nftData.offeredPrice.amount"
                                image-size="16px"
                                no-symbol
                            />
                        </div>
                        <div v-if="nftData.lastTradePrice" class="nftcard_lastprice">
                            <span class="nftcard_lastprice_label">{{ $t('nftcard.lastPrice') }}</span>
                            <a-token-value
                                :token="nftData.lastTradePrice.payToken"
                                :value="nftData.lastTradePrice.amount"
                                image-size="16px"
                                no-symbol
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div class="nftcard_image">
                <div class="nftcard_box">
                    <f-image v-if="!token.imageMimetype" size="100%" src="3d-placeholder.jpg" :alt="nftData.name" />
                    <f-image
                        v-else-if="token.imageMimetype && token.imageMimetype.startsWith('audio/')"
                        size="100%"
                        src="music-placeholder.jpg"
                        :alt="nftData.name"
                    />
                    <f-image v-else size="100%" :src="getImageThumbUrl(nftData.imageThumb)" :alt="nftData.name" />
                </div>
            </div>
            <div class="nftcard_header">
                <button v-if="showBanButton" :data-tooltip="$t('nftcard.banUnban')" @click.prevent="onBanClick">
                    <app-iconset icon="ban" size="16px" :color="dBanned ? '#f00' : ''" />
                </button>
                <nft-like :token="nftData" />
            </div>
        </router-link>
    </div>
</template>

<script>
import { getImageThumbUrl } from '@/utils/url.js';
import ATokenValue from '@/common/components/ATokenValue/ATokenValue.vue';
import dayjs from 'dayjs';
import { banToken, unbanToken } from '@/modules/nfts/mutations/ban.js';
import NftLike from '@/modules/nfts/components/NftLike/NftLike';
import { getToken } from '@/modules/nfts/queries/token.js';

export default {
    name: 'NftCard',

    components: { ATokenValue, NftLike },

    props: {
        nftData: {
            type: Object,
        },
    },

    data() {
        console.log('nftData', this.nftData);

        return {
            showBanButton: this.$wallet.user ? this.$wallet.user.isModerator : false,
            dBanned: this.nftData._banned || false,
            token: {},
        };
    },

    computed: {
        auctionEndTime() {
            const { auction } = this.nftData;

            return auction ? dayjs(auction.endTime).fromNow(true) : '';
        },
    },

    created() {
        this.update();
    },

    methods: {
        async onBanClick() {
            this.dBanned = !this.dBanned;

            if (this.dBanned) {
                await banToken(this.nftData);

                this.$emit('token-ban-unban', { token: this.nftData, ban: true });

                this.$notifications.add({
                    type: 'success',
                    text: this.$t('nftBanned'),
                });
            } else {
                await unbanToken(this.nftData);

                this.$emit('token-ban-unban', { token: this.nftData, unban: true });
                this.$notifications.add({
                    type: 'success',
                    text: this.$t('nftUnbanned'),
                });
            }
        },

        async update() {
            this.token = await getToken(this.nftData.contract, this.nftData.tokenId);
            console.log('this.token', this.token);
        },

        getImageThumbUrl,
    },
};
</script>

<style lang="scss">
@use "style";
</style>
