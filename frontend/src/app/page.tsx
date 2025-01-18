'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon, CopyIcon, RefreshCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ReactNode, useState, useTransition } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import * as z from 'zod';
import { getGifs } from './actions';

export const maxDuration = 60;

const formSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  youtubeUrl: z.string().url('Please enter a valid YouTube URL')
});

export default function Home() {
  const [isPending, startTransition] = useTransition();
  const [gifUrls, setGifUrls] = useState<string[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      youtubeUrl: ''
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const result = await getGifs(values);
      setGifUrls(result.gifUrls);
    });
  }

  return (
    <AnimatePresence>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        {isPending ? (
          <Loading />
        ) : gifUrls.length > 0 ? (
          <Results
            gifUrls={gifUrls}
            resetForm={() => {
              setGifUrls([]);
              form.reset();
            }}
          />
        ) : (
          <GifForm form={form} onSubmit={onSubmit} />
        )}
      </div>
    </AnimatePresence>
  );
}

function GifForm({
  form,
  onSubmit
}: {
  form: UseFormReturn<
    {
      description: string;
      youtubeUrl: string;
    },
    unknown,
    undefined
  >;
  onSubmit: (data: {
    description: string;
    youtubeUrl: string;
  }) => Promise<void> | void;
}) {
  return (
    <motion.div
      className="max-w-md mx-auto rounded-lg shadow-lg p-6"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -10, opacity: 0 }}
    >
      <h1 className="text-2xl font-bold mb-6 text-gray-100">GIF anything</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Describe your GIF" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="youtubeUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Enter YouTube video URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#10a37f] hover:bg-[#1a7f64] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#10a37f]"
          >
            Create GIF
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}

function Loading() {
  return (
    <GridView
      nodes={[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-full w-full bg-foreground/10 animate-pulse rounded-lg"
        />
      ))}
    />
  );
}

function Results({
  gifUrls,
  resetForm
}: {
  gifUrls: string[];
  resetForm: () => void;
}) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy URL: ', err);
    }
  };

  return (
    <>
      <GridView
        nodes={gifUrls.map((url, i) => (
          <div
            key={i}
            className="group relative aspect-square overflow-hidden rounded-lg"
          >
            <img
              src={url}
              alt={`Generated GIF ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              disabled={copiedUrl === url}
              onClick={() => copyToClipboard(url)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Copy to clipboard"
            >
              {copiedUrl === url ? (
                <CheckIcon className="h-3 w-3" />
              ) : (
                <CopyIcon className="h-3 w-3" />
              )}
            </button>
          </div>
        ))}
      />
      <motion.div
        className="max-w-xl w-full mx-auto flex flex-col mt-2"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -10, opacity: 0 }}
        transition={{
          delay: 1
        }}
      >
        <Button
          className="self-end"
          variant={'ghost'}
          onClick={() => resetForm()}
        >
          Make another GIF <RefreshCcw className="w-4 h-4 ml-1" />
        </Button>
      </motion.div>
    </>
  );
}

function GridView({ nodes }: { nodes: ReactNode[] }) {
  return (
    <motion.div
      className="mt-8 grid grid-cols-2 gap-4 max-w-xl mx-auto"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.02 }
        }
      }}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {nodes.map((node, i) => (
        <motion.div
          key={i}
          className="aspect-square overflow-hidden rounded-lg"
          variants={{
            hidden: { opacity: 0, y: 5 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          {node}
        </motion.div>
      ))}
    </motion.div>
  );
}
