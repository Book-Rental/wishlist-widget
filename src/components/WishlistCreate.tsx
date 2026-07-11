import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    Modal,
    Rb_Button,
    Rb_Input,
    ModalHeader,
    Rb_Label,
} from "@rentbook/rentbook-ui-lib";
import axios, { AxiosError } from "axios";
import { toast, ToastContainer } from "react-toastify";

type ErrorResponse = {
    message: string;
};

const WishlistCreate = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [wishlistName, setWishlistName] = useState("");
    const queryClient = useQueryClient();
    const userId =
  window.HOST_USER_INFO?._id ?? "6a3bbe38827e96ec21dcb390";
    const { mutate, isPending } = useMutation({
        mutationFn: async (payload: { name: string; userId: string }) => {
            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/wishList/group`,
                payload
            );
            return data;
        },
        onSuccess: (data) => {
            console.log("Success:", data);
            setIsOpen(false);
            setWishlistName("");
            queryClient.invalidateQueries({
                queryKey: ["wishlistNames", userId],
            });
            toast.success("Wishlist created successfully!");
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            const message =
                error.response?.data?.message || "Something went wrong.";
            toast.error(message);
        },
    });

    const handleCreate = () => {
        mutate({
            name: wishlistName.trim(),
            userId,
        });
    };

    return (
        <>
            <Rb_Button
                className="w-full md:w-auto h-11 px-6 whitespace-nowrap"
                onClick={() => setIsOpen(true)}
            >
                + Create New Wishlist
            </Rb_Button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            >
                <ModalHeader onClose={() => setIsOpen(false)}>
                    Create Wishlist
                </ModalHeader>

                <div className="p-6 flex flex-col gap-4">
                    <Rb_Label required>Wishlist Name</Rb_Label>

                    <Rb_Input
                        placeholder="Enter wishlist name"
                        value={wishlistName}
                        onChange={(e) => setWishlistName(e.target.value)}
                    />

                    <Rb_Button
                        onClick={handleCreate}
                        disabled={!wishlistName.trim() || isPending}
                    >
                        {isPending ? "Creating..." : "Create"}
                    </Rb_Button>
                </div>
            </Modal>
            <ToastContainer
                position="bottom-center"
                autoClose={2000}
                hideProgressBar={true}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="light"
            />
        </>
    );
};

export default WishlistCreate;