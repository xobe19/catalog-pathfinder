import math
from typing import Any

q96 = 2**96
eth = 10**18


def price_to_tick(p):
    return math.floor(math.log(p, 1.0001))


def price_to_sqrtp(p):
    return int(math.sqrt(p) * q96)


def sqrtp_to_price(sqrtp):
    return (sqrtp / q96) ** 2


def tick_to_sqrtp(t):
    return int((1.0001 ** (t / 2)) * q96)


def liquidity0(amount, pa, pb):
    if pa > pb:
        pa, pb = pb, pa
    return (amount * (pa * pb) / q96) / (pb - pa)


def liquidity1(amount, pa, pb):
    if pa > pb:
        pa, pb = pb, pa
    return amount * q96 / (pb - pa)


def calc_amount0(liq, pa, pb):
    if pa > pb:
        pa, pb = pb, pa
    return int(liq * q96 * (pb - pa) / pb / pa)


def calc_amount1(liq, pa, pb):
    if pa > pb:
        pa, pb = pb, pa
    return int(liq * (pb - pa) / q96)


def get_amount_out(
    pool: dict[str, Any],
    token_in_symbol: str,
    token_out_symbol: str,
    amount_in: int | float,
):
    liq = pool["liquidity"]
    sqrtp_cur = pool["sqrtPriceX96"]
    token0_symbol = pool["token0"]["symbol"]
    token1_symbol = pool["token1"]["symbol"]

    if token_in_symbol == token0_symbol:
        # In: token0, Out: token1
        decimals_in = pool["token0"]["decimals"]
        decimals_out = pool["token1"]["decimals"]

        amount_in *= 10**decimals_in
        price_next = int((liq * q96 * sqrtp_cur) // (liq * q96 + amount_in * sqrtp_cur))

        amount_in = calc_amount0(liq, price_next, sqrtp_cur)
        amount_out = calc_amount1(liq, price_next, sqrtp_cur)

        return amount_out / (10**decimals_out)
    elif token_in_symbol == token1_symbol:
        # In: token1, Out: token0
        decimals_in = pool["token1"]["decimals"]
        decimals_out = pool["token0"]["decimals"]

        amount_in *= 10**decimals_in
        price_diff = (amount_in * q96) // liq
        price_next = sqrtp_cur + price_diff

        amount_in = calc_amount1(liq, price_next, sqrtp_cur)
        amount_out = calc_amount0(liq, price_next, sqrtp_cur)

        return amount_out / (10**decimals_out)


pool = {
    "token0": {
        "symbol": "USDC",
        "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "decimals": 6,
    },
    "token1": {
        "symbol": "WETH",
        "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "decimals": 18,
    },
    "liquidity": 2205844668376370500,
    "sqrtPriceX96": 1287904652766006809775726356449899,
}

print(
    get_amount_out(
        pool,
        token_in_symbol="WETH",
        token_out_symbol="USDC",
        amount_in=1039,
    )
)

# usdc_decimals = 6
# weth_decimals = 18

# usdc_to_eth = swap_get_amount_out_usdc_to_eth(
#     sqrtp_cur=1287904652766006809775726356449899,
#     liq=2205844668376370500,
#     amount_in=1029,
#     decimals_in=usdc_decimals,
#     decimals_out=weth_decimals,
# )

# print(usdc_to_eth)

# eth_to_usdc = swap_get_amount_out_eth_to_usdc(
#     sqrtp_cur=1287904652766006809775726356449899,
#     liq=2205844668376370500,
#     amount_in=0.27124,
#     decimals_in=weth_decimals,
#     decimals_out=usdc_decimals,
# )

# print(eth_to_usdc)
