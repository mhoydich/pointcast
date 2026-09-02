"""
kennel_club_fa2.py - Kennel Club September Sitting daily-edition FA2
SmartPy v0.24.1

Thirty fungible FA2 token IDs are registered at origination. Each token ID
represents one September 2026 sitting and can mint only during its stored
[open_at, close_at) UTC window. The calendar source is America/Los_Angeles;
September 2026 is PDT (UTC-7), so each local midnight is 07:00 UTC.

This file deliberately follows the PointCast SmartPy v0.24.1 house style:
no module-level SmartPy type aliases and no undecorated contract helpers.
The standard fa2_lib Fungible base supplies canonical TZIP-12 transfer,
balance_of, and update_operators entrypoints.
"""

import smartpy as sp
from smartpy.templates import fa2_lib as fa2


main = fa2.main


# Exact TZIP-21 editorial fields from
# src/data/kennel-club-september-sitting.json. The image fields intentionally
# remain IPFS placeholders until the verified plates and metadata are pinned.
KENNEL_CLUB_TOKEN_INFO = [
    ("Kennel Club · Sitting 01 · Winslow", "Winslow, Golden Retriever. The Marine Layer. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"01\"},{\"name\":\"Mint date\",\"value\":\"2026-09-01\"},{\"name\":\"Breed\",\"value\":\"Golden Retriever\"},{\"name\":\"Wardrobe\",\"value\":\"a camel cotton overshirt with a cream lightweight knit\"},{\"name\":\"Title\",\"value\":\"The Marine Layer\"}]"),
    ("Kennel Club · Sitting 02 · Hartley", "Hartley, Black Labrador Retriever. The Library Hour. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"02\"},{\"name\":\"Mint date\",\"value\":\"2026-09-02\"},{\"name\":\"Breed\",\"value\":\"Black Labrador Retriever\"},{\"name\":\"Wardrobe\",\"value\":\"a navy wool blazer with brass buttons over a cream shirt collar\"},{\"name\":\"Title\",\"value\":\"The Library Hour\"}]"),
    ("Kennel Club · Sitting 03 · Marguerite", "Marguerite, Afghan Hound. The Estate Wagon. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"03\"},{\"name\":\"Mint date\",\"value\":\"2026-09-03\"},{\"name\":\"Breed\",\"value\":\"Afghan Hound\"},{\"name\":\"Wardrobe\",\"value\":\"a camel coat with a silk headscarf tied under the chin and tortoiseshell sunglasses pushed up\"},{\"name\":\"Title\",\"value\":\"The Estate Wagon\"}]"),
    ("Kennel Club · Sitting 04 · Barnaby", "Barnaby, Basset Hound. The Long Walk. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"04\"},{\"name\":\"Mint date\",\"value\":\"2026-09-04\"},{\"name\":\"Breed\",\"value\":\"Basset Hound\"},{\"name\":\"Wardrobe\",\"value\":\"a waxed cotton field jacket with a corduroy collar and a lightweight tattersall scarf\"},{\"name\":\"Title\",\"value\":\"The Long Walk\"}]"),
    ("Kennel Club · Sitting 05 · Clementine", "Clementine, Cavalier King Charles Spaniel. The Velvet Chair. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"05\"},{\"name\":\"Mint date\",\"value\":\"2026-09-05\"},{\"name\":\"Breed\",\"value\":\"Cavalier King Charles Spaniel\"},{\"name\":\"Wardrobe\",\"value\":\"a burgundy velvet ribbon collar with a single strand of pearls\"},{\"name\":\"Title\",\"value\":\"The Velvet Chair\"}]"),
    ("Kennel Club · Sitting 06 · Augustus", "Augustus, Great Dane. The Tall Windows. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"06\"},{\"name\":\"Mint date\",\"value\":\"2026-09-06\"},{\"name\":\"Breed\",\"value\":\"Great Dane\"},{\"name\":\"Wardrobe\",\"value\":\"a black-and-cream houndstooth cotton blazer with an oxblood silk pocket square\"},{\"name\":\"Title\",\"value\":\"The Tall Windows\"}]"),
    ("Kennel Club · Sitting 07 · Fitzgerald", "Fitzgerald, Irish Setter. The Stable Aisle. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"07\"},{\"name\":\"Mint date\",\"value\":\"2026-09-07\"},{\"name\":\"Breed\",\"value\":\"Irish Setter\"},{\"name\":\"Wardrobe\",\"value\":\"a hunter-green quilted vest over a tattersall shirt with a knotted wool tie\"},{\"name\":\"Title\",\"value\":\"The Stable Aisle\"}]"),
    ("Kennel Club · Sitting 08 · Penelope", "Penelope, Standard Poodle. The Afternoon Room. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"08\"},{\"name\":\"Mint date\",\"value\":\"2026-09-08\"},{\"name\":\"Breed\",\"value\":\"Standard Poodle\"},{\"name\":\"Wardrobe\",\"value\":\"a cream fisherman-knit cotton sweater with a red-and-green tartan throw draped over one shoulder\"},{\"name\":\"Title\",\"value\":\"The Afternoon Room\"}]"),
    ("Kennel Club · Sitting 09 · Alistair", "Alistair, Scottish Terrier. The Highland Cap. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"09\"},{\"name\":\"Mint date\",\"value\":\"2026-09-09\"},{\"name\":\"Breed\",\"value\":\"Scottish Terrier\"},{\"name\":\"Wardrobe\",\"value\":\"a tweed flat cap and a long green tartan scarf wound twice\"},{\"name\":\"Title\",\"value\":\"The Highland Cap\"}]"),
    ("Kennel Club · Sitting 10 · Beatrix", "Beatrix, Whippet. The Boot Room. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"10\"},{\"name\":\"Mint date\",\"value\":\"2026-09-10\"},{\"name\":\"Breed\",\"value\":\"Whippet\"},{\"name\":\"Wardrobe\",\"value\":\"a camel cashmere turtleneck\"},{\"name\":\"Title\",\"value\":\"The Boot Room\"}]"),
    ("Kennel Club · Sitting 11 · Theodore", "Theodore, Bernese Mountain Dog. The Beach Wagon. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"11\"},{\"name\":\"Mint date\",\"value\":\"2026-09-11\"},{\"name\":\"Breed\",\"value\":\"Bernese Mountain Dog\"},{\"name\":\"Wardrobe\",\"value\":\"a navy cotton chore coat with a cream canvas collar\"},{\"name\":\"Title\",\"value\":\"The Beach Wagon\"}]"),
    ("Kennel Club · Sitting 12 · Josephine", "Josephine, Weimaraner. The Grey Morning. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"12\"},{\"name\":\"Mint date\",\"value\":\"2026-09-12\"},{\"name\":\"Breed\",\"value\":\"Weimaraner\"},{\"name\":\"Wardrobe\",\"value\":\"a double-breasted charcoal linen jacket with a pale grey cotton scarf\"},{\"name\":\"Title\",\"value\":\"The Grey Morning\"}]"),
    ("Kennel Club · Sitting 13 · Montgomery", "Montgomery, English Bulldog. The Study. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"13\"},{\"name\":\"Mint date\",\"value\":\"2026-09-13\"},{\"name\":\"Breed\",\"value\":\"English Bulldog\"},{\"name\":\"Wardrobe\",\"value\":\"a black-watch tartan blazer with a wide oxblood bow tie\"},{\"name\":\"Title\",\"value\":\"The Study\"}]"),
    ("Kennel Club · Sitting 14 · Ophelia", "Ophelia, Borzoi. The Allée. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"14\"},{\"name\":\"Mint date\",\"value\":\"2026-09-14\"},{\"name\":\"Breed\",\"value\":\"Borzoi\"},{\"name\":\"Wardrobe\",\"value\":\"an ivory cotton cable-knit sweater under a light navy cotton coat\"},{\"name\":\"Title\",\"value\":\"The Allée\"}]"),
    ("Kennel Club · Sitting 15 · Rutherford", "Rutherford, Airedale Terrier. The Parcel Table. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"15\"},{\"name\":\"Mint date\",\"value\":\"2026-09-15\"},{\"name\":\"Breed\",\"value\":\"Airedale Terrier\"},{\"name\":\"Wardrobe\",\"value\":\"a brown Norfolk jacket with leather buttons and a knit tie\"},{\"name\":\"Title\",\"value\":\"The Parcel Table\"}]"),
    ("Kennel Club · Sitting 16 · Genevieve", "Genevieve, Rough Collie. The First Cool Evening. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"16\"},{\"name\":\"Mint date\",\"value\":\"2026-09-16\"},{\"name\":\"Breed\",\"value\":\"Rough Collie\"},{\"name\":\"Wardrobe\",\"value\":\"a camel cape coat over a cream cotton cardigan\"},{\"name\":\"Title\",\"value\":\"The First Cool Evening\"}]"),
    ("Kennel Club · Sitting 17 · Sebastian", "Sebastian, Dalmatian. The Piano. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"17\"},{\"name\":\"Mint date\",\"value\":\"2026-09-17\"},{\"name\":\"Breed\",\"value\":\"Dalmatian\"},{\"name\":\"Wardrobe\",\"value\":\"a cream shawl-collar cotton cardigan with a red tartan scarf\"},{\"name\":\"Title\",\"value\":\"The Piano\"}]"),
    ("Kennel Club · Sitting 18 · Wilhelmina", "Wilhelmina, Pembroke Welsh Corgi. The Back Steps. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"18\"},{\"name\":\"Mint date\",\"value\":\"2026-09-18\"},{\"name\":\"Breed\",\"value\":\"Pembroke Welsh Corgi\"},{\"name\":\"Wardrobe\",\"value\":\"a burgundy quilted jacket and small green wellington boots\"},{\"name\":\"Title\",\"value\":\"The Back Steps\"}]"),
    ("Kennel Club · Sitting 19 · Bartholomew", "Bartholomew, Bloodhound. The Horn Wall. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"19\"},{\"name\":\"Mint date\",\"value\":\"2026-09-19\"},{\"name\":\"Breed\",\"value\":\"Bloodhound\"},{\"name\":\"Wardrobe\",\"value\":\"a chestnut leather car coat with a heavy cream wool scarf\"},{\"name\":\"Title\",\"value\":\"The Horn Wall\"}]"),
    ("Kennel Club · Sitting 20 · Cordelia", "Cordelia, Yellow Labrador Retriever. The Poolside Bench. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"20\"},{\"name\":\"Mint date\",\"value\":\"2026-09-20\"},{\"name\":\"Breed\",\"value\":\"Yellow Labrador Retriever\"},{\"name\":\"Wardrobe\",\"value\":\"a cream cotton aran sweater with a green tartan blanket over the shoulders and a pair of leather deck shoes set beside her\"},{\"name\":\"Title\",\"value\":\"The Poolside Bench\"}]"),
    ("Kennel Club · Sitting 21 · Ignatius", "Ignatius, Newfoundland. The Evening Pier. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"21\"},{\"name\":\"Mint date\",\"value\":\"2026-09-21\"},{\"name\":\"Breed\",\"value\":\"Newfoundland\"},{\"name\":\"Wardrobe\",\"value\":\"a navy double-breasted cotton peacoat with the collar turned up\"},{\"name\":\"Title\",\"value\":\"The Evening Pier\"}]"),
    ("Kennel Club · Sitting 22 · Rosalind", "Rosalind, Vizsla. The Conservatory. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"22\"},{\"name\":\"Mint date\",\"value\":\"2026-09-22\"},{\"name\":\"Breed\",\"value\":\"Vizsla\"},{\"name\":\"Wardrobe\",\"value\":\"a rust suede jacket with a cream silk scarf\"},{\"name\":\"Title\",\"value\":\"The Conservatory\"}]"),
    ("Kennel Club · Sitting 23 · Percival", "Percival, Wire Fox Terrier. The Staircase. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"23\"},{\"name\":\"Mint date\",\"value\":\"2026-09-23\"},{\"name\":\"Breed\",\"value\":\"Wire Fox Terrier\"},{\"name\":\"Wardrobe\",\"value\":\"a navy chalk-stripe suit with a red silk pocket square\"},{\"name\":\"Title\",\"value\":\"The Staircase\"}]"),
    ("Kennel Club · Sitting 24 · Evangeline", "Evangeline, Samoyed. The Window at Dusk. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"24\"},{\"name\":\"Mint date\",\"value\":\"2026-09-24\"},{\"name\":\"Breed\",\"value\":\"Samoyed\"},{\"name\":\"Wardrobe\",\"value\":\"an ivory cotton coat fastened with a single gold pin\"},{\"name\":\"Title\",\"value\":\"The Window at Dusk\"}]"),
    ("Kennel Club · Sitting 25 · Reginald", "Reginald, Saint Bernard. The Sunroom Morning. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"25\"},{\"name\":\"Mint date\",\"value\":\"2026-09-25\"},{\"name\":\"Breed\",\"value\":\"Saint Bernard\"},{\"name\":\"Wardrobe\",\"value\":\"a red tartan dressing gown with velvet lapels and a cream silk cravat\"},{\"name\":\"Title\",\"value\":\"The Sunroom Morning\"}]"),
    ("Kennel Club · Sitting 26 · Harriet", "Harriet, Beagle. The Club Meet. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"26\"},{\"name\":\"Mint date\",\"value\":\"2026-09-26\"},{\"name\":\"Breed\",\"value\":\"Beagle\"},{\"name\":\"Wardrobe\",\"value\":\"a brown tweed hacking jacket with a white stock tie and a gold pin\"},{\"name\":\"Title\",\"value\":\"The Club Meet\"}]"),
    ("Kennel Club · Sitting 27 · Lancelot", "Lancelot, Irish Wolfhound. The Great Hall. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"27\"},{\"name\":\"Mint date\",\"value\":\"2026-09-27\"},{\"name\":\"Breed\",\"value\":\"Irish Wolfhound\"},{\"name\":\"Wardrobe\",\"value\":\"a grey herringbone blazer with a light wool collar\"},{\"name\":\"Title\",\"value\":\"The Great Hall\"}]"),
    ("Kennel Club · Sitting 28 · Isadora", "Isadora, Greyhound. The Station Platform. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"28\"},{\"name\":\"Mint date\",\"value\":\"2026-09-28\"},{\"name\":\"Breed\",\"value\":\"Greyhound\"},{\"name\":\"Wardrobe\",\"value\":\"a navy cotton coat over a camel lightweight turtleneck\"},{\"name\":\"Title\",\"value\":\"The Station Platform\"}]"),
    ("Kennel Club · Sitting 29 · Ambrose", "Ambrose, German Shorthaired Pointer. The Hedgerow. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"29\"},{\"name\":\"Mint date\",\"value\":\"2026-09-29\"},{\"name\":\"Breed\",\"value\":\"German Shorthaired Pointer\"},{\"name\":\"Wardrobe\",\"value\":\"a green loden coat with horn buttons and a leather-wrapped flask in the pocket\"},{\"name\":\"Title\",\"value\":\"The Hedgerow\"}]"),
    ("Kennel Club · Sitting 30 · Florence", "Florence, English Springer Spaniel. The Letters. One of thirty daily portrait sittings minted one per day through September 2026 on Tezos.", "[{\"name\":\"Sitting\",\"value\":\"30\"},{\"name\":\"Mint date\",\"value\":\"2026-09-30\"},{\"name\":\"Breed\",\"value\":\"English Springer Spaniel\"},{\"name\":\"Wardrobe\",\"value\":\"a cream cable-knit sweater with a tortoiseshell hair clip on one ear\"},{\"name\":\"Title\",\"value\":\"The Letters\"}]"),
]


def make_kennel_club_token_metadata():
    token_metadata = []
    for token_id, (name, description, attributes) in enumerate(KENNEL_CLUB_TOKEN_INFO):
        image_uri = "ipfs://PLACEHOLDER_KENNEL_CLUB_SITTING_%02d" % (token_id + 1)
        token_metadata.append(
            sp.map(
                l={
                    "name": sp.scenario_utils.bytes_of_string(name),
                    "description": sp.scenario_utils.bytes_of_string(description),
                    "symbol": sp.scenario_utils.bytes_of_string("KCSIT"),
                    "decimals": sp.scenario_utils.bytes_of_string("0"),
                    "artifactUri": sp.scenario_utils.bytes_of_string(image_uri),
                    "displayUri": sp.scenario_utils.bytes_of_string(image_uri),
                    "thumbnailUri": sp.scenario_utils.bytes_of_string(image_uri),
                    "attributes": sp.scenario_utils.bytes_of_string(attributes),
                }
            )
        )
    return token_metadata


def make_september_windows():
    windows = []
    for token_id in range(30):
        day = token_id + 1
        if day < 30:
            close_year = 2026
            close_month = 9
            close_day = day + 1
        else:
            close_year = 2026
            close_month = 10
            close_day = 1
        windows.append(
            sp.record(
                token_id=sp.nat(token_id),
                open_at=sp.timestamp_from_utc(2026, 9, day, 7, 0, 0),
                close_at=sp.timestamp_from_utc(
                    close_year, close_month, close_day, 7, 0, 0
                ),
            )
        )
    return windows


@sp.module
def m():
    import main

    class KennelClubFA2(
        main.Fungible,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        def __init__(
            self,
            administrator,
            treasury,
            metadata,
            token_metadata,
            windows,
            edition_mode,
            edition_cap,
            price_mutez,
            paused,
        ):
            main.OnchainviewBalanceOf.__init__(self)
            main.OffchainviewTokenMetadata.__init__(self)
            main.Fungible.__init__(self, metadata, {}, token_metadata)

            sp.cast(administrator, sp.address)
            sp.cast(treasury, sp.address)
            sp.cast(edition_mode, sp.string)
            sp.cast(edition_cap, sp.nat)
            sp.cast(price_mutez, sp.mutez)
            sp.cast(paused, sp.bool)
            assert edition_mode == "open" or edition_mode == "capped", "INVALID_EDITION_MODE"
            assert edition_cap > 0, "INVALID_EDITION_CAP"

            self.data.administrator = administrator
            self.data.treasury = treasury
            self.data.edition_mode = edition_mode
            self.data.edition_cap = edition_cap
            self.data.price_mutez = price_mutez
            self.data.paused = paused
            self.data.windows = sp.cast(
                sp.big_map(),
                sp.big_map[
                    sp.nat,
                    sp.record(open_at=sp.timestamp, close_at=sp.timestamp),
                ],
            )

            for window in windows:
                assert window.token_id in self.data.token_metadata, "TOKEN_NOT_REGISTERED"
                assert window.open_at < window.close_at, "INVALID_WINDOW"
                self.data.windows[window.token_id] = sp.record(
                    open_at=window.open_at,
                    close_at=window.close_at,
                )

        @sp.entrypoint
        def mint(self, token_id):
            sp.cast(token_id, sp.nat)
            assert not self.data.paused, "MINT_PAUSED"
            assert token_id in self.data.token_metadata, "TOKEN_NOT_REGISTERED"
            assert token_id in self.data.windows, "WINDOW_NOT_SET"

            window = self.data.windows[token_id]
            assert sp.now >= window.open_at, "MINT_NOT_OPEN"
            assert sp.now < window.close_at, "MINT_CLOSED"
            assert sp.amount == self.data.price_mutez, "WRONG_MINT_AMOUNT"

            current = self.data.supply[token_id]
            if self.data.edition_mode == "capped":
                assert current < self.data.edition_cap, "EDITION_CAP_REACHED"

            ledger_key = (sp.sender, token_id)
            self.data.ledger[ledger_key] = self.data.ledger.get(
                ledger_key, default=sp.nat(0)
            ) + 1
            self.data.supply[token_id] = current + 1

            if self.data.price_mutez > sp.mutez(0):
                sp.send(self.data.treasury, self.data.price_mutez)

        @sp.entrypoint
        def set_window(self, token_id, open_at, close_at):
            sp.cast(token_id, sp.nat)
            sp.cast(open_at, sp.timestamp)
            sp.cast(close_at, sp.timestamp)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            assert token_id in self.data.token_metadata, "TOKEN_NOT_REGISTERED"
            assert open_at < close_at, "INVALID_WINDOW"
            self.data.windows[token_id] = sp.record(
                open_at=open_at,
                close_at=close_at,
            )

        @sp.entrypoint
        def set_price(self, new_price_mutez):
            sp.cast(new_price_mutez, sp.mutez)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.price_mutez = new_price_mutez

        @sp.entrypoint
        def set_treasury(self, new_treasury):
            sp.cast(new_treasury, sp.address)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.treasury = new_treasury

        @sp.entrypoint
        def set_admin(self, new_administrator):
            sp.cast(new_administrator, sp.address)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.administrator = new_administrator

        @sp.entrypoint
        def set_paused(self, paused):
            sp.cast(paused, sp.bool)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.paused = paused

        @sp.onchain_view()
        def get_window(self, token_id):
            sp.cast(token_id, sp.nat)
            assert token_id in self.data.windows, "WINDOW_NOT_SET"
            return self.data.windows[token_id]

        @sp.onchain_view()
        def minted(self, token_id):
            sp.cast(token_id, sp.nat)
            assert token_id in self.data.token_metadata, "TOKEN_NOT_REGISTERED"
            return self.data.supply[token_id]

        @sp.onchain_view()
        def price(self):
            return self.data.price_mutez


@sp.module
def treasury_module():
    class TreasurySink(sp.Contract):
        def __init__(self):
            self.data.received = sp.mutez(0)

        @sp.entrypoint
        def default(self):
            self.data.received += sp.amount


@sp.add_test()
def test_kennel_club_fa2():
    scenario = sp.test_scenario("kennel_club_fa2", [fa2.t, fa2.main, m])
    scenario.add_module(treasury_module)

    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")
    carol = sp.test_account("carol")

    treasury = treasury_module.TreasurySink()
    scenario += treasury

    price = sp.mutez(250_000)
    contract = m.KennelClubFA2(
        administrator=admin.address,
        treasury=treasury.address,
        metadata=sp.scenario_utils.metadata_of_url(
            "ipfs://PLACEHOLDER_KENNEL_CLUB_CONTRACT_METADATA"
        ),
        token_metadata=make_kennel_club_token_metadata(),
        windows=make_september_windows(),
        edition_mode="capped",
        edition_cap=sp.nat(2),
        price_mutez=price,
        paused=False,
    )
    scenario += contract

    opens = sp.timestamp_from_utc(2026, 9, 3, 7, 0, 0)
    closes = sp.timestamp_from_utc(2026, 9, 4, 7, 0, 0)

    scenario.h2("Window is inclusive at open and exclusive at close")
    contract.mint(
        2,
        _sender=alice,
        _amount=price,
        _now=sp.timestamp_from_utc(2026, 9, 3, 6, 59, 59),
        _valid=False,
        _exception="MINT_NOT_OPEN",
    )
    contract.mint(2, _sender=alice, _amount=price, _now=opens)
    contract.mint(
        2,
        _sender=bob,
        _amount=price,
        _now=closes,
        _valid=False,
        _exception="MINT_CLOSED",
    )

    scenario.h2("Exact price and capped editions")
    contract.mint(
        2,
        _sender=bob,
        _amount=sp.mutez(249_999),
        _now=sp.timestamp_from_utc(2026, 9, 3, 12, 0, 0),
        _valid=False,
        _exception="WRONG_MINT_AMOUNT",
    )
    contract.mint(
        2,
        _sender=bob,
        _amount=price,
        _now=sp.timestamp_from_utc(2026, 9, 3, 12, 0, 0),
    )
    contract.mint(
        2,
        _sender=carol,
        _amount=price,
        _now=sp.timestamp_from_utc(2026, 9, 3, 12, 0, 1),
        _valid=False,
        _exception="EDITION_CAP_REACHED",
    )
    scenario.verify(contract.data.ledger[(alice.address, 2)] == 1)
    scenario.verify(contract.data.ledger[(bob.address, 2)] == 1)
    scenario.verify(contract.minted(2) == 2)

    scenario.h2("Open editions ignore the configured cap")
    open_contract = m.KennelClubFA2(
        administrator=admin.address,
        treasury=treasury.address,
        metadata=sp.scenario_utils.metadata_of_url(
            "ipfs://PLACEHOLDER_KENNEL_CLUB_CONTRACT_METADATA"
        ),
        token_metadata=make_kennel_club_token_metadata(),
        windows=make_september_windows(),
        edition_mode="open",
        edition_cap=sp.nat(1),
        price_mutez=sp.mutez(0),
        paused=False,
    )
    scenario += open_contract
    open_contract.mint(2, _sender=alice, _now=opens)
    open_contract.mint(2, _sender=bob, _now=opens)
    open_contract.mint(2, _sender=carol, _now=opens)
    scenario.verify(open_contract.minted(2) == 3)

    scenario.h2("Every successful mint forwards proceeds")
    scenario.verify(treasury.data.received == sp.mutez(500_000))
    scenario.verify(contract.balance == sp.mutez(0))

    scenario.h2("Admin can repair a late window and change price")
    repaired_open = sp.timestamp_from_utc(2026, 9, 2, 18, 0, 0)
    repaired_close = sp.timestamp_from_utc(2026, 9, 4, 7, 0, 0)
    contract.set_window(
        token_id=0,
        open_at=repaired_open,
        close_at=repaired_close,
        _sender=admin,
    )
    scenario.verify(contract.get_window(0).open_at == repaired_open)
    contract.set_price(sp.mutez(500_000), _sender=admin)
    scenario.verify(contract.price() == sp.mutez(500_000))

    scenario.h2("Pause and admin checks")
    contract.set_paused(True, _sender=admin)
    contract.mint(
        0,
        _sender=alice,
        _amount=sp.mutez(500_000),
        _now=sp.timestamp_from_utc(2026, 9, 2, 18, 1, 0),
        _valid=False,
        _exception="MINT_PAUSED",
    )
    contract.set_window(
        token_id=0,
        open_at=repaired_open,
        close_at=repaired_close,
        _sender=alice,
        _valid=False,
        _exception="NOT_ADMIN",
    )


@sp.add_test()
def compile_kennel_club_fa2():
    scenario = sp.test_scenario("kennel_club_fa2_compile", [fa2.t, fa2.main, m])
    mike = sp.address("tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw")
    contract = m.KennelClubFA2(
        administrator=mike,
        treasury=mike,
        metadata=sp.scenario_utils.metadata_of_url(
            "ipfs://PLACEHOLDER_KENNEL_CLUB_CONTRACT_METADATA"
        ),
        token_metadata=make_kennel_club_token_metadata(),
        windows=make_september_windows(),
        edition_mode="capped",
        edition_cap=sp.nat(30),
        price_mutez=sp.mutez(0),
        paused=True,
    )
    scenario += contract
    scenario.verify(contract.data.next_token_id == 30)
    scenario.verify(contract.data.paused)
