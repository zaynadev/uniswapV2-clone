import React, {useState, useEffect} from "react";
import { contractABI, contractAddress } from '../lib/constants'
import { ethers } from 'ethers'

export const TransactionContext = React.createContext();

let eth;
if (typeof window !== 'undefined') {
    eth = window.ethereum
  }

export const TransactionProvider = ({children}) =>{
    const [currentAccount, setCurrentAccount] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        addressTo: '',
        amount: '',
      });

    useEffect(() => {
        checkIfWalletIsConnected()
    }, [])

    const handleChange = (e, name) => {
        setFormData(prevState => ({ ...prevState, [name]: e.target.value }))
      }

    const connectWallet = async(metamask = eth) => {
        if(!metamask) alert("Please install Metamask!");
        
        try{
            const accounts = await metamask.request({method: "eth_requestAccounts"});
            setCurrentAccount(accounts[0]);
        }catch(err){
            console.log("Erreur connect wallet: ", err)
        }
    }

    
    const getEthereumContract = () => {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const transactionContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer,
        )
      
        return transactionContract
    }

    const checkIfWalletIsConnected = async (metamask = eth) => {
        try {
          if (!metamask) return alert('Please install metamask ')
    
          const accounts = await metamask.request({ method: 'eth_accounts' })
    
          if (accounts.length) {
            setCurrentAccount(accounts[0])
          }
        } catch (error) {
          console.error(error)
          throw new Error('No ethereum object.')
        }
      }


      const sendTransaction = async (
        metamask = eth,
        connectedAccount = currentAccount,
      ) => {
        try {
          if (!metamask) return alert('Please install metamask ')
          const { addressTo, amount } = formData
          const transactionContract = getEthereumContract()
    
          const parsedAmount = ethers.utils.parseEther(amount)
    
          await metamask.request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: connectedAccount,
                to: addressTo,
                gas: '0x7EF40', // 520000 Gwei
                value: parsedAmount._hex,
              },
            ],
          })
    
          const transactionHash = await transactionContract.publishTransaction(
            addressTo,
            parsedAmount,
            `Transferring ETH ${parsedAmount} to ${addressTo}`,
            'TRANSFER',
          )
    
          setIsLoading(true)
    
          await transactionHash.wait()
    
          setIsLoading(false)
        } catch (error) {
          console.log(error)
        }
      }

    return (
        <TransactionContext.Provider value={
            {
                connectWallet,
                currentAccount,
                formData,
                setFormData,
                handleChange,
                sendTransaction,
                isLoading,
            }
        }>
            {children}
        </TransactionContext.Provider>
    )
}

