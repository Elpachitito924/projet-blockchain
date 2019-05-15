#!/bin/bash

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo
echo "Building legitcheck network end-to-end test"
echo
CHANNEL_NAME="$1"
DELAY="$2"
LANGUAGE="$3"
TIMEOUT="$4"
: ${CHANNEL_NAME:="mychannel"}
: ${DELAY:="3"}
: ${LANGUAGE:="golang"}
: ${TIMEOUT:="10"}
LANGUAGE=`echo "$LANGUAGE" | tr [:upper:] [:lower:]`
COUNTER=1
MAX_RETRY=5
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/legitcheck.com/orderers/orderer.legitcheck.com/msp/tlscacerts/tlsca.legitcheck.com-cert.pem

CC_SRC_PATH="github.com/chaincode/diplome/go/"
if [ "$LANGUAGE" = "node" ]; then
	CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/diplome/node/"
fi

echo "Channel name : "$CHANNEL_NAME

# import utils
. scripts/utils.sh

createChannel() {
	setGlobals 0 1

	if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
                set -x
		peer channel create -o orderer.legitcheck.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx >&log.txt
		res=$?
                set +x
	else
				set -x
		peer channel create -o orderer.legitcheck.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
		res=$?
				set +x
	fi
	cat log.txt
	verifyResult $res "Channel creation failed"
	echo "===================== Channel \"$CHANNEL_NAME\" is created successfully ===================== "
	echo
}

joinChannel () {
	for org in 1 2; do
	    for peer in 0 1; do
		joinChannelWithRetry $peer $org
		echo "===================== peer${peer}.org${org} joined on the channel \"$CHANNEL_NAME\" ===================== "
		sleep $DELAY
		echo
	    done
	done
}

## Create channel
echo "Creating channel..."
createChannel

## Join all the peers to the channel
echo "Having all peers join the channel..."
joinChannel

## Set the anchor peers for each org in the channel
echo "Updating anchor peers for atos..."
updateAnchorPeers 0 1
echo "Updating anchor peers for esme..."
updateAnchorPeers 0 2

## Install chaincode on peer0.atos and peer0.esme
echo "Installing chaincode on peer0.atos..."
installChaincode 0 1
echo "Install chaincode on peer0.esme..."
installChaincode 0 2

# Instantiate chaincode on peer0.esme
echo "Instantiating chaincode on peer0.esme..."
instantiateChaincode 0 2

# Query chaincode on peer0.atos
echo "Querying chaincode on peer0.atos..."
chaincodeQuery 0 1 100

# Invoke chaincode on peer0.atos
echo "Sending invoke transaction on peer0.atos..."
chaincodeInvoke 0 1

## Install chaincode on peer1.esme
echo "Installing chaincode on peer1.esme..."
installChaincode 1 2

# Query on chaincode on peer1.esme, check if the result is 90
echo "Querying chaincode on peer1.esme..."
chaincodeQuery 1 2 90

echo
echo "========= All GOOD, legitcheck execution completed =========== "
echo "====== BANG, legitcheck is happy to show you this unicorn ======== "

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo "                        "
echo " \ "
echo "  \ji"
echo " /.((( "
echo "(,/(((__,--."
echo "    \  ) _( /{ "
echo "    !||  :||      "
echo "    !||  :|| "
echo "    '''  '''"


exit 0
