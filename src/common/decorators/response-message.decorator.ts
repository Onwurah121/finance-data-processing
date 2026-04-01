import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_METADATA_KEY = 'response_message';

/**
 * Attach a custom success message to a route handler or controller.
 * The TransformInterceptor will pick this up and include it in the response.
 *
 * @example
 * @ResponseMessage('User created successfully')
 * @Post()
 * create() { ... }
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_METADATA_KEY, message);
