import { ContentType } from '@standardnotes/common'
import { FillItemContent } from '../../Abstract/Content/ItemContent'
import {
  DecryptedPayload,
  EncryptedPayload,
  isEncryptedPayload,
  PayloadTimestampDefaults,
} from '../../Abstract/Payload'
import { PayloadCollection } from '../Collection/Payload/PayloadCollection'
import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import { ItemsKeyContent } from '../../Syncable/ItemsKey/ItemsKeyInterface'
import { ItemsKeyDelta } from './ItemsKeyDelta'

describe('items key delta', () => {
  it('if local items key is decrypted, incoming encrypted should not overwrite', async () => {
    const baseCollection = new PayloadCollection()
    const basePayload = new DecryptedPayload<ItemsKeyContent>({
      uuid: '123',
      content_type: ContentType.ItemsKey,
      content: FillItemContent<ItemsKeyContent>({
        itemsKey: 'secret',
      }),
      ...PayloadTimestampDefaults(),
      updated_at_timestamp: 1,
    })

    baseCollection.set(basePayload)

    const payloadToIgnore = new EncryptedPayload({
      uuid: '123',
      content_type: ContentType.ItemsKey,
      content: '004:...',
      enc_item_key: '004:...',
      items_key_id: undefined,
      errorDecrypting: false,
      waitingForKey: false,
      ...PayloadTimestampDefaults(),
      updated_at_timestamp: 2,
    })

    const delta = new ItemsKeyDelta(ImmutablePayloadCollection.FromCollection(baseCollection), [payloadToIgnore])

    const result = delta.result()
    const updatedBasePayload = result.emits?.[0] as DecryptedPayload<ItemsKeyContent>

    expect(updatedBasePayload.content.itemsKey).toBe('secret')
    expect(updatedBasePayload.updated_at_timestamp).toBe(2)
    expect(updatedBasePayload.dirty).toBeFalsy()

    const ignored = result.ignored?.[0] as EncryptedPayload
    expect(ignored).toBeTruthy()
    expect(isEncryptedPayload(ignored)).toBe(true)
  })
})
