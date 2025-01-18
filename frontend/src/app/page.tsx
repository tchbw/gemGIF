'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormReturn } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import * as Fade from '@/components/motion/fade';
import { useTransition, useState, ReactNode } from 'react';
import { getGifs } from './actions';
import { AnimatePresence, motion } from 'motion/react';

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
          <Results gifUrls={gifUrls} />
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
  }) => Promise<void>;
}) {
  return (
    <motion.div
      className="max-w-md mx-auto rounded-lg shadow-lg p-6"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -10, opacity: 0 }}
    >
      <h1 className="text-2xl font-bold mb-6 text-gray-100">Create GIF</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GIF Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Describe the GIF you want to create"
                    {...field}
                  />
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
                <FormLabel>YouTube URL</FormLabel>
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
        <div key={i} className="h-48 bg-gray-700 animate-pulse rounded-lg" />
      ))}
    />
  );
}

function Results({ gifUrls }: { gifUrls: string[] }) {
  return (
    <GridView
      nodes={gifUrls.map((url, i) => (
        <div key={i} className="aspect-square overflow-hidden rounded-lg">
          <img
            src={url}
            alt={`Generated GIF ${i + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    />
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
