'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { useTransition, useState } from 'react';
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
    <Fade.Container className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto rounded-lg shadow-lg p-6">
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
              disabled={isPending}
            >
              {isPending ? 'Creating...' : 'Create GIF'}
            </Button>
          </form>
        </Form>

        {isPending ? (
          <div className="mt-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-48 bg-gray-700 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : gifUrls.length > 0 ? (
          <div className="mt-8 space-y-4">
            {gifUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Generated GIF ${i + 1}`}
                className="w-full rounded-lg"
              />
            ))}
          </div>
        ) : null}
      </div>
    </Fade.Container>
  );
}
