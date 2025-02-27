<template>
    <div class="nftdetail container">
        <div class="nftdetail_main">
            <div class="nftdetail_media">
                <div v-if="!token.imageMimetype" class="nftdetail_video">
                    <a-model :src="token.image" />
                </div>
                <div
                    v-else-if="token.imageMimetype && token.imageMimetype.startsWith('video/')"
                    class="nftdetail_video"
                >
                    <a-video :src="token.image" :poster="getImageThumbUrl(token.imageThumb)" loop />
                </div>
                <div
                    v-else-if="token.imageMimetype && token.imageMimetype.startsWith('audio/')"
                    class="nftdetail_video"
                >
                    <a-video
                        :src="token.image"
                        poster="https://static.vecteezy.com/system/resources/previews/001/233/267/original/glowing-golden-note-music-design-vector.jpg"
                    />
                </div>
                <div v-else class="nftdetail_img">
                    <f-image :src="token.image" :alt="token.name" :lazy-loading="false" />
                </div>
            </div>
            <div class="nftdetail_product">
                <div class="nftdetail_infoWrap">
                    <nft-detail-collection :collection="token.collection" />

                    <div class="nftdetail_name">
                        <h1 data-focus>
                            <a-placeholder
                                block
                                :content-loaded="!!token.tokenId"
                                replacement-text="token name"
                                class="nftdetail_tokenname"
                            >
                                <span>{{ token.name }}</span>
                                <f-ellipsis
                                    :text="`#${toBigNumber(token.tokenId).toString(10)}`"
                                    overflow="middle"
                                    class="nftdetail_tokenid"
                                />
                            </a-placeholder>
                        </h1>
                    </div>
                    <div class="nftdetail_description">
                        {{ token.description }}
                    </div>
                    <div class="nftdetail_status">
                        <div class="nftdetail_owner">
                            <span>{{ $t('nftdetail.owned') }}</span>
                            <router-link
                                :to="{
                                    name: 'account',
                                    params: { address: tokenOwner.address },
                                }"
                                :aria-label="`${$t('nftdetail.owned')} ${tokenOwnerName || tokenOwner.address}`"
                            >
                                <a-address
                                    :address="tokenOwner.address"
                                    :name="tokenOwnerName"
                                    :image="tokenOwner.avatarThumb"
                                    is-account
                                />
                            </router-link>
                        </div>
                        <div class="nftdetail_views">
                            <app-iconset icon="view" />
                            {{ toInt(token.views) }} {{ $t('nftdetail.views') }}
                        </div>
                        <div class="nftdetail_favorites">
                            <nft-like :token="token" :label="$t('nftdetail.favorites')" />
                        </div>
                    </div>

                    <div v-if="userOwnsToken && token.contract" class="nftdetail_owneractions">
                        <template v-if="!tokenHasAuction">
                            <nft-start-auction-button v-if="!tokenHasListing" :token="token" @tx-success="update" />
                            <nft-sell-button v-if="!tokenHasListing" :token="token" @tx-success="update" />
                        </template>
                        <template v-else>
                            <nft-cancel-auction-button :token="token" :auction="auction" @tx-success="update" />
                            <nft-update-auction-button v-if="!auctionHasFinished" :token="token" @tx-success="update" />
                        </template>

                        <template v-if="tokenHasListing">
                            <nft-cancel-listing-button :token="token" :listing="listing" @tx-success="update" />
                            <nft-update-listing-button :token="token" :listing="listing" @tx-success="update" />
                        </template>
                    </div>

                    <nft-detail-price
                        ref="nftDetailPrice"
                        :token="token"
                        :listing="listing"
                        :user-owns-token="userOwnsToken"
                        :token-has-auction="tokenHasAuction"
                        @tx-success="onNftDetailPriceTxSuccess"
                    />

                    <div class="topcornerbuttons">
                        <nft-transfer-button v-if="userOwnsToken" :token="token" @tx-success="update" />
                        <a-share-button
                            :twitter-text="$t('ashareButton.checkOutItem')"
                            :class="{ 'btn-noleftradius': userOwnsToken }"
                        />
                    </div>
                </div>
            </div>
            <div class="nftdetail_data">
                <nft-auction
                    v-if="tokenHasAuction"
                    :user-owns-token="userOwnsToken"
                    :auction="auction"
                    :token="token"
                    @tx-success="update"
                    @auction-time-up="update"
                />

                <nft-unlockable v-if="token.hasUnlockable" :token="token" :user-owns-token="userOwnsToken" />

                <a-details strategy="create">
                    <template #label>
                        <div class="nftdetail_details_wrap">
                            <h2><app-iconset icon="graf" /> {{ $t('nftdetail.priceHistory') }}</h2>
                        </div>
                    </template>
                    <template>
                        <nft-price-history />
                    </template>
                </a-details>

                <a-details open class="adetails_p0">
                    <template #label>
                        <div class="nftdetail_details_wrap">
                            <h2><app-iconset icon="table-list" /> {{ $t('nftdetail.attributes') }}</h2>
                        </div>
                    </template>
                    <template>
                        <nft-attributes-grid />
                    </template>
                </a-details>
                <a-details open class="adetails_p0">
                    <template #label>
                        <div class="nftdetail_details_wrap">
                            <h2><app-iconset icon="tag" /> {{ $t('nftdetail.listings') }}</h2>
                        </div>
                    </template>
                    <template>
                        <nft-listings-grid
                            ref="listingsGrid"
                            :token="token"
                            :user-owns-token="userOwnsToken"
                            @tx-success="update"
                        />
                    </template>
                </a-details>
                <a-details open class="adetails_p0">
                    <template #label>
                        <div class="nftdetail_details_wrap">
                            <h2><app-iconset icon="list" /> {{ $t('nftdetail.directOffers') }}</h2>
                        </div>
                    </template>
                    <nft-direct-offers-grid
                        ref="directOffersGrid"
                        :token="token"
                        :user-owns-token="userOwnsToken"
                        :token-has-auction="tokenHasAuction"
                        @tx-success="update"
                    />
                </a-details>
            </div>

            <nft-detail-info :info="token" />
        </div>

        <div class="nftdetail_collection">
            <a-details strategy="create" open>
                <template #label>
                    <div class="nftdetail_details_wrap">
                        <h2><app-iconset icon="recycle" /> {{ $t('nftdetail.itemActivity') }}</h2>
                    </div>
                </template>
                <template>
                    <nft-item-activity :token="token" />
                </template>
            </a-details>
        </div>

        <div class="nftdetail_collection">
            <a-details strategy="create">
                <template #label>
                    <div class="nftdetail_details_wrap">
                        <h2><app-iconset icon="collection" /> {{ $t('nftdetail.fromCollection') }}</h2>
                    </div>
                </template>
                <template>
                    <nft-more-from-collection-list :token="token" horizontal />
                </template>
            </a-details>
        </div>

        <a-sign-transaction :tx="tx" hidden />
    </div>
</template>

<script>
import AppIconset from '@/modules/app/components/AppIconset/AppIconset';
import ADetails from '@/common/components/ADetails/ADetails';
import AShareButton from '@/common/components/AShareButton/AShareButton';
import NftDetailInfo from '@/modules/nfts/components/NftDetailInfo/NftDetailInfo.vue';
import NftListingsGrid from '@/modules/nfts/components/NftListingsGrid/NftListingsGrid.vue';
import NftAttributesGrid from '@/modules/nfts/components/NftAttributesGrid/NftAttributesGrid.vue';
import NftDirectOffersGrid from '@/modules/nfts/components/NftDirectOffersGrid/NftDirectOffersGrid';
import { toBigNumber, toHex, toInt } from '@/utils/big-number.js';
import ASignTransaction from '@/common/components/ASignTransaction/ASignTransaction.vue';
import { getImageThumbUrl } from '@/utils/url.js';
import { getToken } from '@/modules/nfts/queries/token.js';
import { mapState } from 'vuex';
import NftAuction from '@/modules/nfts/components/NftAuction/NftAuction.vue';

import NftMoreFromCollectionList from '@/modules/nfts/components/NftMoreFromCollectionList/NftMoreFromCollectionList.vue';
import AAddress from '@/common/components/AAddress/AAddress.vue';
import NftCancelListingButton from '@/modules/nfts/components/NftCancelListingButton/NftCancelListingButton.vue';
import NftSellButton from '@/modules/nfts/components/NftSellButton/NftSellButton.vue';
import NftDetailPrice from '@/modules/nfts/components/NftDetailPrice/NftDetailPrice.vue';
import { incrementTokenViews } from '@/modules/nfts/mutations/views';
import { getTokenListings } from '@/modules/nfts/queries/token-listings.js';
import { getTokenOwnerships } from '@/modules/nfts/queries/token-ownerships.js';
import NftUpdateListingButton from '@/modules/nfts/components/NftUpdateListingButton/NftUpdateListingButton.vue';
import NftStartAuctionButton from '@/modules/nfts/components/NftStartAuctionButton/NftStartAuctionButton.vue';
import NftCancelAuctionButton from '@/modules/nfts/components/NftCancelAuctionButton/NftCancelAuctionButton.vue';
import { getAuction } from '@/modules/nfts/queries/auction.js';
import { isExpired } from '@/utils/date.js';
import NftDetailCollection from '@/modules/nfts/components/NftDetailCollection/NftDetailCollection.vue';
import { compareAddresses } from '@/utils/address.js';
import AVideo from '@/common/components/AVideo/AVideo';
import AModel from '@/common/components/AModel/AModel';
import NftPriceHistory from '@/modules/nfts/components/NftPriceHistory/NftPriceHistory.vue';
import NftUpdateAuctionButton from '@/modules/nfts/components/NftUpdateAuctionButton/NftUpdateAuctionButton.vue';

import NftItemActivity from '@/modules/nfts/components/NftItemActivity/NftItemActivity';
import { documentMeta } from '@/modules/app/DocumentMeta.js';
import { focusElem } from 'fantom-vue-components/src/utils/aria.js';
import NftUnlockable from '@/modules/nfts/components/NftUnlockable/NftUnlockable';
import NftLike from '@/modules/nfts/components/NftLike/NftLike';
import FEllipsis from 'fantom-vue-components/src/components/FEllipsis/FEllipsis.vue';
import NftTransferButton from '@/modules/nfts/components/NftTransferButton/NftTransferButton';

export default {
    name: 'NftDetail',

    components: {
        NftUnlockable,
        NftUpdateAuctionButton,
        NftDetailInfo,
        NftDetailCollection,
        NftCancelAuctionButton,
        NftStartAuctionButton,
        NftUpdateListingButton,
        NftDetailPrice,
        NftSellButton,
        NftCancelListingButton,
        AAddress,
        NftAuction,
        ASignTransaction,
        ADetails,
        AppIconset,
        AShareButton,
        NftListingsGrid,
        NftAttributesGrid,
        NftDirectOffersGrid,
        NftMoreFromCollectionList,
        AVideo,
        NftPriceHistory,
        NftItemActivity,
        NftLike,
        NftTransferButton,
        FEllipsis,
        AModel,
    },

    data() {
        return {
            token: {},
            userOwnsToken: false,
            inEscrow: false,
            listing: {},
            /** @type {Auction} */
            auction: {},
            tokenOwner: {},
            tx: {},
        };
    },

    computed: {
        ...mapState('wallet', {
            walletAddress: 'account',
        }),

        tokenHasListing() {
            return !!this.listing.unitPrice && !this.listing.closed && this.listing.isActive;
        },

        tokenHasAuction() {
            const { auction } = this;

            return this.token.hasAuction || (auction.contract ? !auction.closed : false);
        },

        auctionHasFinished() {
            return isExpired(this.auction.endTime);
        },

        tokenOwnerName() {
            const { tokenOwner } = this;

            return tokenOwner
                ? compareAddresses(tokenOwner.address, this.walletAddress)
                    ? this.$t('me')
                    : tokenOwner.username
                : '';
        },
    },

    watch: {
        walletAddress(value) {
            this.onWalletAddressChange(value);
        },

        $route() {
            this.init();
        },
    },

    created() {
        const routeParams = this.$route.params;

        this.init();

        incrementTokenViews(routeParams.tokenContract, toHex(routeParams.tokenId));
    },

    methods: {
        async init() {
            const routeParams = this.$route.params;

            if (!routeParams.tokenContract || !routeParams.tokenId) {
                this.$router.push({ name: '404' });
            } else {
                this.update();
            }
        },

        async update() {
            const routeParams = this.$route.params;

            this.tokenOwner = await this.getTokenOwner(routeParams.tokenContract, routeParams.tokenId);
            this.token = await getToken(routeParams.tokenContract, toHex(routeParams.tokenId));

            console.log('Token', this.token);

            if (!this.token) {
                this.$router.push({ name: '404' });
                return;
            }

            documentMeta.setMetaInfo({
                title: this.token.name,
                description: this.token.description || this.token.name,
            });

            focusElem(this.$el);

            this.token._inEscrow = this.inEscrow;

            if (this.auction.contract) {
                setTimeout(() => {
                    this.loadAuction();
                }, 500);
            } else {
                await this.loadAuction();
            }

            this.onWalletAddressChange();
        },

        async loadAuction() {
            this.auction = (await getAuction(this.token.contract, this.token.tokenId)) || {};
        },

        async onWalletAddressChange() {
            const { $wallet } = this;

            if ($wallet.connected && $wallet.account) {
                this.userOwnsToken = compareAddresses(this.tokenOwner.address, $wallet.account);
            } else {
                this.userOwnsToken = false;
            }

            if (!this._isDestroyed) {
                await this.$refs.nftDetailPrice.update();
                await this.setListing();
            }
        },

        /**
         * @param {string} tokenContract
         * @param {string} tokenId
         * @return {Promise<Object>}
         */
        async getTokenOwner(tokenContract, tokenId) {
            const data = await getTokenOwnerships(tokenContract, tokenId, { first: 500 }, true);

            if (data && data.edges.length > 0) {
                this.inEscrow = data.edges[0].node.inEscrow;

                return data.edges[0].node.ownerUser;
            }

            return {};
        },

        async setListing() {
            const { token } = this;

            const data = await getTokenListings(token.contract, token.tokenId, { first: 200 });
            const listings = data.edges.map(edge => edge.node);

            this.listing = {};

            for (let i = 0, len = listings.length; i < len; i++) {
                if (!listings[i].closed && listings[i].isActive) {
                    this.listing = listings[i];
                    break;
                }
            }
        },

        onNftDetailPriceTxSuccess(code) {
            const { $refs } = this;

            if (code === 'make_offer') {
                this.onWalletAddressChange();
                if ($refs.directOffersGrid) {
                    $refs.directOffersGrid.update();
                }
            } else if (code === 'buy') {
                this.update();
            }
        },

        toInt,
        toBigNumber,
        getImageThumbUrl,
        compareAddresses,
    },
};
</script>

<style lang="scss">
@use 'style';
</style>
