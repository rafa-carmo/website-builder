"use client"

import { Agency, User } from "@prisma/client"
import React, { createContext, useContext, useEffect, useState } from "react"

interface ModalProviderProps {
	children: React.ReactNode
}

export interface ModalData {
	user?: User
	agency?: Agency
}

type ModalContentType = {
	data: ModalData
	isOpen: boolean
	// biome-ignore lint: generic modal
	setOpen: (modal: React.ReactNode, fetchData?: () => Promise<any>) => void
	setClose: () => void
}

export const ModalContext = createContext<ModalContentType>({
	data: {},
	isOpen: false,
	// biome-ignore lint: default value
	setOpen: (modal: React.ReactNode, fetchData?: () => Promise<any>) => {},
	setClose: () => {},
})

const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
	const [isOpen, setIsOpen] = useState(false)
	const [data, setData] = useState<ModalData>({})
	const [showingModal, setShowingModal] = useState<React.ReactNode>(null)
	const [isMounted, setIsMounted] = useState(false)

	useEffect(() => setIsMounted(true), [])

	const setOpen = async (
		modal: React.ReactNode,
		// biome-ignore lint: default value
		fetchData?: () => Promise<any>,
	) => {
		if (modal) {
			if (fetchData) {
				setData({ ...data, ...(await fetchData()) } || {})
			}
			setShowingModal(modal)
			setIsOpen(true)
		}
	}

	const setClose = () => {
		setIsOpen(false)
		setData({})
	}

	if (!isMounted) return null

	return (
		<ModalContext.Provider value={{ data, setOpen, setClose, isOpen }}>
			{children}
			{showingModal}
		</ModalContext.Provider>
	)
}

export const useModal = () => {
	const context = useContext(ModalContext)
	if (!context) {
		throw new Error("Use modal must be used within the modal provider")
	}

	return context
}

export default ModalProvider
